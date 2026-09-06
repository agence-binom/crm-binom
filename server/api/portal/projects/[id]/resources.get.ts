import { desc, eq } from 'drizzle-orm'
import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { projectIdSchema } from '~/validation/projects'
import { withResourcesDownloadUrls } from '~~/server/utils/resources'
import { getPortalClient, requirePortalProject } from '~~/server/utils/client-portal'

export default defineEventHandler(async (event) => {
  const client = getPortalClient(event)
  const { id: projectId } = await getValidatedRouterParams(event, projectIdSchema.parse)

  await requirePortalProject(client.id, projectId)

  const resources = await db
    .select()
    .from(resourcesTable)
    .where(eq(resourcesTable.projectId, projectId))
    .orderBy(desc(resourcesTable.createdAt))

  return { resources: await withResourcesDownloadUrls(event, resources) }
})
