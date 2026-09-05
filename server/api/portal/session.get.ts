import type { InferSelectModel } from 'drizzle-orm'
import type { contactsTable } from '~/db/schema/contacts'
import type { clientsTable } from '~/db/schema/clients'

// Appelé à chaque navigation par le middleware ET par la page /espace-client : ne doit faire
// qu'une vérification, sans effet de bord (voir /api/portal/touch-login pour l'enregistrement
// de la dernière connexion, déclenché une seule fois à la fin du flow de connexion).
// Le contact/client actifs sont déjà résolus et vérifiés par ../../middleware/01-auth.ts.
export default defineEventHandler(async (event) => {
  const contact = event.context.portalContact as InferSelectModel<typeof contactsTable>
  const client = event.context.portalClient as InferSelectModel<typeof clientsTable>

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
