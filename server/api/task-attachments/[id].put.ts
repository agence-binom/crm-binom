import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { taskAttachmentsTable } from '~/db/schema/task-attachments'
import { taskAttachmentIdSchema, taskAttachmentUpdateSchema } from '~/validation/task-attachments'
import { withTaskAttachmentsDownloadUrls } from '~~/server/utils/task-attachments'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, taskAttachmentIdSchema.parse)
  const body = await readValidatedBody(event, taskAttachmentUpdateSchema.parse)

  const [attachment] = await db
    .update(taskAttachmentsTable)
    .set({ ...body, updatedBy: getAppUser(event).id, updatedAt: new Date() })
    .where(eq(taskAttachmentsTable.id, id))
    .returning()

  if (!attachment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pièce jointe non trouvée'
    })
  }

  void logActivity(event, { entityType: 'task_attachment', entityId: id, action: 'update', metadata: { name: attachment.name } })

  const [attachmentWithUrl] = await withTaskAttachmentsDownloadUrls(event, [attachment])
  return attachmentWithUrl
})
