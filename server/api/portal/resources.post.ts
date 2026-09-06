import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { resourceCreateSchema } from '~/validation/resources'
import { getPortalClient, getPortalContact, requirePortalProject } from '~~/server/utils/client-portal'
import { logActivity } from '~~/server/utils/activity-log'

export default defineEventHandler(async (event) => {
  const client = getPortalClient(event)
  const contact = getPortalContact(event)
  const body = await readValidatedBody(event, resourceCreateSchema.parse)

  await requirePortalProject(client.id, body.projectId)

  const [resource] = await db.insert(resourcesTable).values({
    projectId: body.projectId,
    type: body.type,
    name: body.name,
    description: body.description?.trim() || null,
    url: body.type === 'link' ? body.url : null,
    content: body.type === 'text' ? body.content : null,
    createdByContactId: contact.id
  }).returning()

  void logActivity(event, { entityType: 'resource', entityId: resource!.id, action: 'create', metadata: { name: resource!.name } })

  return { ...resource, downloadUrl: null }
})
