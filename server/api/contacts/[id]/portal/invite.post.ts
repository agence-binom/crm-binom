import { createError } from 'h3'
import { contactIdSchema } from '~/validation/contacts'
import { getPortalServiceRoleClient, requireContactById } from '../../../../utils/client-portal'
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
    // connexion classique à la place, sinon "Envoyer le mail" n'enverrait jamais rien.
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

  return {
    message: 'Mail envoyé'
  }
})
