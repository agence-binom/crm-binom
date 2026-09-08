import { projectIdSchema } from '~/validation/projects'
import { getProjectDeliverables } from '~~/server/utils/deliverables'
import { getPortalClient, requirePortalProject } from '~~/server/utils/client-portal'

export default defineEventHandler(async (event) => {
  const client = getPortalClient(event)
  const { id: projectId } = await getValidatedRouterParams(event, projectIdSchema.parse)

  await requirePortalProject(client.id, projectId)

  return { deliverables: await getProjectDeliverables(event, projectId) }
})
