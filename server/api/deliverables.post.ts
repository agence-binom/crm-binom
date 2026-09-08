import { db } from '~/db'
import { deliverablesTable } from '~/db/schema/deliverables'
import { deliverableCreateSchema } from '~/validation/deliverables'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, deliverableCreateSchema.parse)

  const [deliverable] = await db.insert(deliverablesTable).values({
    projectId: body.projectId,
    type: body.type,
    name: body.name,
    description: body.description?.trim() || null,
    url: body.type === 'link' ? body.url : null,
    content: body.type === 'text' ? body.content : null,
    createdBy: getAppUser(event).id
  }).returning()

  void logActivity(event, { entityType: 'deliverable', entityId: deliverable!.id, action: 'create', metadata: { name: deliverable!.name } })

  return { ...deliverable, downloadUrl: null }
})
