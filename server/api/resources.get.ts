import { desc, eq } from 'drizzle-orm'
import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { resourceListQuerySchema } from '~/validation/resources'
import { withResourcesDownloadUrls } from '~~/server/utils/resources'

export default defineEventHandler(async (event) => {
  const query = resourceListQuerySchema.parse(getQuery(event))

  const resources = await db
    .select()
    .from(resourcesTable)
    .where(query.projectId ? eq(resourcesTable.projectId, query.projectId) : undefined)
    .orderBy(desc(resourcesTable.createdAt))

  return { resources: await withResourcesDownloadUrls(event, resources) }
})
