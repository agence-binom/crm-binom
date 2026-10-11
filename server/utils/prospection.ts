import type { H3Event } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { projectsTable } from '~/db/schema/projects'
import { finalClientStatus, isClientStatus } from '~/constants/prospection'
import { getProjectDisplayStatus, presaleProjectStatus } from '~/lib/projects'
import { logActivity } from './activity-log'

// Seul point de passage automatique prospect -> client (et sortie d'avant-vente du projet) : appelé après qu'un devis (billing_documents
// documentType='quote') est mis à jour. Un client déjà 'client' n'est jamais rétrogradé ici - seule
// la fiche client (Modal, champ prospectionStatus) permet de revenir en arrière.
export const promoteClientIfQuoteSigned = async (event: H3Event, billingDocument: { documentType: string, status: string, projectId: number }) => {
  if (billingDocument.documentType !== 'quote' || billingDocument.status !== 'completed') return

  await leavePresaleOnQuoteSigned(billingDocument.projectId)

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

// Un devis signé clôt l'avant-vente : le projet reprend le statut que lui donnent ses dates (et
// devient visible dans l'espace client, qui masque les projets en avant-vente).
const leavePresaleOnQuoteSigned = async (projectId: number) => {
  const [project] = await db
    .select({ startDate: projectsTable.startDate, endDate: projectsTable.endDate })
    .from(projectsTable)
    .where(and(eq(projectsTable.id, projectId), eq(projectsTable.status, presaleProjectStatus)))
  if (!project) return

  await db
    .update(projectsTable)
    .set({ status: getProjectDisplayStatus({ ...project, status: 'en_cours' }), updatedAt: new Date() })
    .where(eq(projectsTable.id, projectId))
}
