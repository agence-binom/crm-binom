import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { resourceIdSchema } from '~/validation/resources'
import { deleteStoredDocumentFile } from '~~/server/utils/documents'
import { logActivity } from '~~/server/utils/activity-log'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, resourceIdSchema.parse)
  const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id))

  if (!resource) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ressource non trouvée'
    })
  }

  if (resource.type === 'document' && resource.filepath) {
    await deleteStoredDocumentFile(event, resource.filepath)
  }

  await db.delete(resourcesTable).where(eq(resourcesTable.id, id))

  void logActivity(event, { entityType: 'resource', entityId: id, action: 'delete', metadata: { name: resource.name } })

  setResponseStatus(event, 204)
  return null
})
