import { db } from '~/db'
import { taskAttachmentsTable } from '~/db/schema/task-attachments'
import { taskAttachmentCreateSchema } from '~/validation/task-attachments'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, taskAttachmentCreateSchema.parse)

  const [attachment] = await db.insert(taskAttachmentsTable).values({
    taskId: body.taskId,
    type: body.type,
    name: body.name,
    description: body.description?.trim() || null,
    url: body.url
  }).returning()

  return { ...attachment, downloadUrl: null }
})
