import { requireActivePortalContactWithClient } from '../../utils/client-portal'
import { requireSupabaseUser } from '../../utils/auth'

// Appelé à chaque navigation par le middleware ET par la page /espace-client : ne doit faire
// qu'une vérification, sans effet de bord (voir /api/portal/touch-login pour l'enregistrement
// de la dernière connexion, déclenché une seule fois à la fin du flow de connexion).
export default defineEventHandler(async (event) => {
  const userSession = await requireSupabaseUser(event)
  const { contact, client } = await requireActivePortalContactWithClient(userSession.email)

  return {
    contact: {
      firstName: contact.firstName,
      lastName: contact.lastName,
      portalLastLoginAt: contact.portalLastLoginAt
    },
    client: {
      name: client.name
    }
  }
})
