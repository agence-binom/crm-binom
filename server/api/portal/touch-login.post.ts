import { requireActivePortalContactByEmail, touchPortalContactLastLogin } from '../../utils/client-portal'
import { requireSupabaseUser } from '../../utils/auth'

// Appelé une seule fois, depuis /confirm, à la fin réelle du flow de connexion (échange du lien
// magique contre une session) — pas à chaque vérification d'accès (voir /api/portal/session,
// utilisé par le middleware à chaque navigation), pour que "Dernière connexion" reflète la
// précédente connexion et non la dernière vérification en date.
export default defineEventHandler(async (event) => {
  const userSession = await requireSupabaseUser(event)
  const contact = await requireActivePortalContactByEmail(userSession.email)

  await touchPortalContactLastLogin(contact.id)

  setResponseStatus(event, 204)
  return null
})
