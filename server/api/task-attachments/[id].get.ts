import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { taskAttachmentsTable } from '~/db/schema/task-attachments'
import { taskAttachmentIdSchema } from '~/validation/task-attachments'
import { withTaskAttachmentsDownloadUrls } from '~~/server/utils/task-attachments'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, taskAttachmentIdSchema.parse)

  const [attachment] = await db.select().from(taskAttachmentsTable).where(eq(taskAttachmentsTable.id, id))

  if (!attachment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pièce jointe non trouvée'
    })
  }

  const [attachmentWithUrl] = await withTaskAttachmentsDownloadUrls(event, [attachment])
  return attachmentWithUrl
})
