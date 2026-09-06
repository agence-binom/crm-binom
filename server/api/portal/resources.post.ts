import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { resourceCreateSchema } from '~/validation/resources'
import { getPortalClient, requirePortalProject } from '~~/server/utils/client-portal'

export default defineEventHandler(async (event) => {
  const client = getPortalClient(event)
  const body = await readValidatedBody(event, resourceCreateSchema.parse)

  await requirePortalProject(client.id, body.projectId)

  const [resource] = await db.insert(resourcesTable).values({
    projectId: body.projectId,
    type: body.type,
    name: body.name,
    description: body.description?.trim() || null,
    url: body.type === 'link' ? body.url : null,
    content: body.type === 'text' ? body.content : null
  }).returning()

  return { ...resource, downloadUrl: null }
})
