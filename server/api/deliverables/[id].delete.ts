import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { deliverablesTable } from '~/db/schema/deliverables'
import { deliverableIdSchema } from '~/validation/deliverables'
import { deleteStoredDocumentFile } from '~~/server/utils/documents'
import { logActivity } from '~~/server/utils/activity-log'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, deliverableIdSchema.parse)
  const [deliverable] = await db.select().from(deliverablesTable).where(eq(deliverablesTable.id, id))

  if (!deliverable) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Livrable non trouvé'
    })
  }

  if (deliverable.type === 'document' && deliverable.filepath) {
    await deleteStoredDocumentFile(event, deliverable.filepath)
  }

  await db.delete(deliverablesTable).where(eq(deliverablesTable.id, id))

  void logActivity(event, { entityType: 'deliverable', entityId: id, action: 'delete', metadata: { name: deliverable.name } })

  setResponseStatus(event, 204)
  return null
})
