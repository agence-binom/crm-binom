import { db } from '~/db/index'
import { clientsTable } from '~/db/schema/clients'
import { eq } from 'drizzle-orm'
import { clientUpdateSchema, clientIdSchema } from '~/validation/clients'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'
import { getProspectionStatusSideEffects, getStatusAdvanceFromDateEntry } from '~/lib/prospection'
import type { ProspectionStatus } from '~/constants/prospection'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, clientIdSchema.parse)
  const body = await readValidatedBody(event, clientUpdateSchema.parse)

  const client = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, id))

  if (client.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Client non trouvé'
    })
  }

  const previousClient = client[0]!

  // Le formulaire d'édition renvoie toujours prospectionStatus (même inchangé) - ne déclencher les
  // effets de bord (archivage, horodatage) que sur un changement de statut réel, sinon une simple
  // édition d'un autre champ écraserait un archivage manuel sans rapport avec la prospection.
  const statusChanged = body.prospectionStatus !== undefined && body.prospectionStatus !== previousClient.prospectionStatus

  // Sens inverse : saisir à la main une date de contact/relance (jusque-là vide) fait avancer le
  // statut, sauf si cette même requête change déjà explicitement le statut (on ne veut pas qu'un
  // backfill de date vienne contredire un choix de statut fait dans le même formulaire).
  const statusAdvance = !statusChanged
    ? getStatusAdvanceFromDateEntry(previousClient.prospectionStatus as ProspectionStatus, {
        contactedAtAdded: body.contactedAt !== undefined && body.contactedAt !== null && !previousClient.contactedAt,
        relancedAtAdded: body.relancedAt !== undefined && body.relancedAt !== null && !previousClient.relancedAt
      })
    : null

  const clientUpdated = await db
    .update(clientsTable)
    .set({
      ...body,
      ...(statusChanged ? getProspectionStatusSideEffects(body.prospectionStatus!) : {}),
      ...(statusAdvance ? { prospectionStatus: statusAdvance } : {}),
      updatedBy: getAppUser(event).id,
      updatedAt: new Date()
    })
    .where(eq(clientsTable.id, id))
    .returning()

  void logActivity(event, { entityType: 'client', entityId: id, action: 'update', metadata: { name: clientUpdated[0]!.name, prospectionStatus: clientUpdated[0]!.prospectionStatus } })

  return {
    message: 'Client modifié',
    client: clientUpdated[0]
  }
})
