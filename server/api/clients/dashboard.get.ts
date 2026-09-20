import { and, asc, eq, ne, or } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { finalClientStatus, lostProspectStatus } from '~/constants/prospection'
import { clientsDashboardQuerySchema } from '~/validation/clients'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, clientsDashboardQuerySchema.parse)

  const scopeCondition = query.scope === 'prospects'
    ? ne(clientsTable.prospectionStatus, finalClientStatus)
    : eq(clientsTable.prospectionStatus, finalClientStatus)

  // Un prospect 'perdu' est archivé automatiquement (cf. getProspectionStatusSideEffects) mais doit
  // rester visible dans sa colonne du kanban : le tableau de prospection (archived=false) inclut donc
  // aussi les perdus malgré leur archivage. La vue "prospects archivés" (archived=true) n'a pas besoin
  // de ce cas particulier, elle affiche déjà tous les archivés perdus ou non.
  const archivedCondition = query.scope === 'prospects' && !query.archived
    ? or(eq(clientsTable.archived, false), eq(clientsTable.prospectionStatus, lostProspectStatus))
    : eq(clientsTable.archived, query.archived)

  const clients = await db
    .select({
      id: clientsTable.id,
      name: clientsTable.name,
      email: clientsTable.email,
      phone: clientsTable.phone,
      address: clientsTable.address,
      city: clientsTable.city,
      postalCode: clientsTable.postalCode,
      country: clientsTable.country,
      website: clientsTable.website,
      siret: clientsTable.siret,
      notes: clientsTable.notes,
      icon: clientsTable.icon,
      archived: clientsTable.archived,
      description: clientsTable.description,
      prospectionStatus: clientsTable.prospectionStatus,
      contactedAt: clientsTable.contactedAt,
      relancedAt: clientsTable.relancedAt
    })
    .from(clientsTable)
    .orderBy(asc(clientsTable.name), asc(clientsTable.id))
    .where(and(scopeCondition, archivedCondition))

  return {
    clients
  }
})
