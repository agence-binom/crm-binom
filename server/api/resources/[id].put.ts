import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { resourceIdSchema, resourceUpdateSchema } from '~/validation/resources'
import { withResourcesDownloadUrls } from '~~/server/utils/resources'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, resourceIdSchema.parse)
  const body = await readValidatedBody(event, resourceUpdateSchema.parse)

  const [resource] = await db
    .update(resourcesTable)
    .set({ ...body, updatedByUserId: getAppUser(event).id, updatedByContactId: null, updatedAt: new Date() })
    .where(eq(resourcesTable.id, id))
    .returning()

  if (!resource) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ressource non trouvée'
    })
  }

  void logActivity(event, { entityType: 'resource', entityId: id, action: 'update', metadata: { name: resource.name } })

  const [resourceWithUrl] = await withResourcesDownloadUrls(event, [resource])
  return resourceWithUrl
})
