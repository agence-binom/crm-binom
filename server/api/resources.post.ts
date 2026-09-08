import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { resourceCreateSchema } from '~/validation/resources'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const appUser = getAppUser(event)
  const body = await readValidatedBody(event, resourceCreateSchema.parse)

  const [resource] = await db.insert(resourcesTable).values({
    projectId: body.projectId,
    type: body.type,
    name: body.name,
    description: body.description?.trim() || null,
    url: body.type === 'link' ? body.url : null,
    content: body.type === 'text' ? body.content : null,
    createdByUserId: appUser.id
  }).returning()

  void logActivity(event, { entityType: 'resource', entityId: resource!.id, action: 'create', metadata: { name: resource!.name } })

  return { ...resource, downloadUrl: null }
})
