import type { InferSelectModel } from 'drizzle-orm'
import type { contactsTable } from '~/db/schema/contacts'
import { touchPortalContactLastLogin } from '../../utils/client-portal'

// Appelé une seule fois, depuis /confirm, à la fin réelle du flow de connexion (échange du lien
// magique contre une session) — pas à chaque vérification d'accès (voir /api/portal/session,
// utilisé par le middleware à chaque navigation), pour que "Dernière connexion" reflète la
// précédente connexion et non la dernière vérification en date.
// Le contact actif est déjà résolu et vérifié par ../../middleware/01-auth.ts.
export default defineEventHandler(async (event) => {
  const contact = event.context.portalContact as InferSelectModel<typeof contactsTable>

  await touchPortalContactLastLogin(contact.id)

  setResponseStatus(event, 204)
  return null
})
