import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '~/db/index'
import { contactsTable } from '~/db/schema/contacts'
import { contactIdSchema } from '~/validation/contacts'
import { findConflictingPortalContact, getPortalServiceRoleClient, requireContactById } from '../../../../utils/client-portal'
import { canManagePortalAccess, isAlreadyRegisteredAuthError } from '../../../../lib/client-portal'

export default defineEventHandler(async (event) => {
  if (!canManagePortalAccess(event.context.appUser?.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seuls les administrateurs peuvent gérer l’accès portail d’un contact'
    })
  }

  const { id } = await getValidatedRouterParams(event, contactIdSchema.parse)

  const contact = await requireContactById(id)

  if (contact.archived) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Impossible de donner un accès portail à un contact archivé'
    })
  }

  if (!contact.email) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Un email est requis pour donner accès au portail'
    })
  }

  if (!contact.clientId) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Le contact doit être rattaché à un client pour accéder au portail'
    })
  }

  const conflict = await findConflictingPortalContact(contact.email, contact.id)
  if (conflict) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Un autre contact utilise déjà cet email pour l’accès portail'
    })
  }

  const config = useRuntimeConfig(event)
  const redirectTo = config.public.siteUrl ? `${config.public.siteUrl}/confirm` : undefined

  const supabase = getPortalServiceRoleClient(event)
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(contact.email, { redirectTo })

  if (inviteError) {
    if (!isAlreadyRegisteredAuthError(inviteError)) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Impossible d’envoyer le lien de connexion au contact'
      })
    }

    // Le compte Supabase Auth existe déjà : inviteUserByEmail n'envoie rien dans ce cas
    // (c'est l'email d'invitation initiale, pas un renvoi). On envoie donc un lien de
    // connexion classique à la place, sinon "Renvoyer le lien" n'enverrait jamais rien.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: contact.email,
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo }
    })

    if (otpError) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Impossible d’envoyer le lien de connexion au contact'
      })
    }
  }

  const [updatedContact] = await db
    .update(contactsTable)
    .set({ portalStatus: 'active', updatedAt: new Date() })
    .where(eq(contactsTable.id, id))
    .returning()

  return {
    message: 'Accès portail activé',
    contact: updatedContact
  }
})
