import { desc, eq } from 'drizzle-orm'
import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { resourceListQuerySchema } from '~/validation/resources'
import { withResourcesDownloadUrls } from '~~/server/utils/resources'

export default defineEventHandler(async (event) => {
  const query = resourceListQuerySchema.parse(getQuery(event))

  const filter = query.taskId
    ? eq(resourcesTable.taskId, query.taskId)
    : query.projectId
      ? eq(resourcesTable.projectId, query.projectId)
      : undefined

  const resources = await db
    .select()
    .from(resourcesTable)
    .where(filter)
    .orderBy(desc(resourcesTable.createdAt))

  return { resources: await withResourcesDownloadUrls(event, resources) }
})
