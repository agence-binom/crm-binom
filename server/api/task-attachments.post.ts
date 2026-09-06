import { db } from '~/db'
import { taskAttachmentsTable } from '~/db/schema/task-attachments'
import { taskAttachmentCreateSchema } from '~/validation/task-attachments'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, taskAttachmentCreateSchema.parse)

  const [attachment] = await db.insert(taskAttachmentsTable).values({
    taskId: body.taskId,
    type: body.type,
    name: body.name,
    description: body.description?.trim() || null,
    url: body.url,
    createdBy: getAppUser(event).id
  }).returning()

  void logActivity(event, { entityType: 'task_attachment', entityId: attachment!.id, action: 'create', metadata: { name: attachment!.name } })

  return { ...attachment, downloadUrl: null }
})
