import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { resourceIdSchema } from '~/validation/resources'
import { deleteStoredDocumentFile } from '~~/server/utils/documents'

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

  setResponseStatus(event, 204)
  return null
})
