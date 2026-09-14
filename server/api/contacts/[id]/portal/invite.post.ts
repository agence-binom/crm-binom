import { randomUUID } from 'node:crypto'
import { createError } from 'h3'
import { sql } from 'drizzle-orm'
import { db } from '~/db'
import { authUserTable } from '~/db/schema/auth'
import { contactIdSchema } from '~/validation/contacts'
import { auth } from '../../../../lib/better-auth'
import { requireContactById } from '../../../../utils/client-portal'
import { canManagePortalAccess } from '../../../../lib/client-portal'
import { normalizeEmailAddress } from '../../../../lib/auth-users'

export default defineEventHandler(async (event) => {
  if (!canManagePortalAccess(event.context.appUser?.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seuls les administrateurs peuvent gérer l’accès portail d’un contact'
    })
  }

  const { id } = await getValidatedRouterParams(event, contactIdSchema.parse)

  const contact = await requireContactById(id)

  // L'activation (statut + vérifications d'éligibilité) se fait via l'endpoint "activate", séparé
  // pour ne jamais envoyer de mail à l'activation. Ici on ne fait qu'envoyer le lien de connexion,
  // donc le contact doit déjà avoir un accès actif.
  if (contact.portalStatus !== 'active') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Le contact doit d’abord avoir un accès portail actif pour recevoir un mail'
    })
  }

  if (!contact.email) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Un email est requis pour envoyer le lien de connexion'
    })
  }

  const config = useRuntimeConfig(event)
  const callbackURL = config.public.siteUrl ? `${config.public.siteUrl}/confirm` : '/confirm'
  const normalizedEmail = normalizeEmailAddress(contact.email)

  // Contrairement à Supabase (admin.inviteUserByEmail créait le compte auth ET envoyait le mail
  // en un appel), Better Auth n'a pas de notion d'invitation distincte : on crée l'utilisateur
  // nous-mêmes s'il n'existe pas encore (seul cas légitime de création admin, disableSignUp:true
  // bloque toute auto-inscription via le flux normal), puis on déclenche l'envoi du lien.
  const [existingAuthUser] = await db
    .select({ id: authUserTable.id })
    .from(authUserTable)
    .where(sql`lower(${authUserTable.email}) = ${normalizedEmail}`)
    .limit(1)

  if (!existingAuthUser) {
    await db.insert(authUserTable).values({
      id: randomUUID(),
      email: normalizedEmail,
      name: `${contact.firstName} ${contact.lastName}`.trim(),
      emailVerified: false
    })
  }

  try {
    await auth.api.signInMagicLink({ headers: event.headers, body: { email: contact.email, callbackURL } })
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Impossible d’envoyer le lien de connexion au contact'
    })
  }

  return {
    message: 'Mail envoyé'
  }
})
