import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { taskAttachmentsTable } from '~/db/schema/task-attachments'
import { taskAttachmentIdSchema } from '~/validation/task-attachments'
import { deleteStoredDocumentFile } from '~~/server/utils/documents'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, taskAttachmentIdSchema.parse)
  const [attachment] = await db.select().from(taskAttachmentsTable).where(eq(taskAttachmentsTable.id, id))

  if (!attachment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pièce jointe non trouvée'
    })
  }

  if (attachment.type === 'document' && attachment.filepath) {
    await deleteStoredDocumentFile(event, attachment.filepath)
  }

  await db.delete(taskAttachmentsTable).where(eq(taskAttachmentsTable.id, id))

  setResponseStatus(event, 204)
  return null
})
