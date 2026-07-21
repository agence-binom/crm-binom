import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { resourceIdSchema } from '~/validation/resources'
import { withResourcesDownloadUrls } from '~~/server/utils/resources'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, resourceIdSchema.parse)

  const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id))

  if (!resource) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ressource non trouvée'
    })
  }

  const [resourceWithUrl] = await withResourcesDownloadUrls(event, [resource])
  return resourceWithUrl
})
