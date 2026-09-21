import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { projectsTable } from '~/db/schema/projects'
import { finalClientStatus, isClientStatus } from '~/constants/prospection'
import { logActivity } from './activity-log'

// Seul point de passage automatique prospect -> client : appelé après qu'un devis (billing_documents
// documentType='quote') est mis à jour. Un client déjà 'client' n'est jamais rétrogradé ici - seule
// la fiche client (Modal, champ prospectionStatus) permet de revenir en arrière.
export const promoteClientIfQuoteSigned = async (event: H3Event, billingDocument: { documentType: string, status: string, projectId: number }) => {
  if (billingDocument.documentType !== 'quote' || billingDocument.status !== 'completed') return

  const [client] = await db
    .select({ id: clientsTable.id, name: clientsTable.name, prospectionStatus: clientsTable.prospectionStatus })
    .from(projectsTable)
    .innerJoin(clientsTable, eq(clientsTable.id, projectsTable.clientId))
    .where(eq(projectsTable.id, billingDocument.projectId))

  if (!client || isClientStatus(client.prospectionStatus)) return

  await db
    .update(clientsTable)
    .set({ prospectionStatus: finalClientStatus, updatedAt: new Date() })
    .where(eq(clientsTable.id, client.id))

  void logActivity(event, { entityType: 'client', entityId: client.id, action: 'update', metadata: { name: client.name, prospectionStatus: finalClientStatus } })
}
