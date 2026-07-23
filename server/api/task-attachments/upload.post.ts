import { db } from '~/db'
import { taskAttachmentsTable } from '~/db/schema/task-attachments'
import { taskAttachmentUploadMetadataSchema } from '~/validation/task-attachments'
import { buildDocumentStoragePath, uploadDocumentFile, withDocumentDownloadUrl, deleteUploadedDocumentIfExists } from '~~/server/utils/documents'
import { assertValidTaskAttachmentFile } from '~~/server/utils/task-attachments'
import { createTaskAttachmentInsertValues } from '~~/server/lib/task-attachments-upload'

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)
  const fileEntry = formData.get('file')

  if (!(fileEntry instanceof File)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Aucun fichier fourni'
    })
  }

  assertValidTaskAttachmentFile(fileEntry)

  const metadata = taskAttachmentUploadMetadataSchema.parse({
    taskId: formData.get('taskId'),
    name: formData.get('name'),
    description: formData.get('description')
  })

  const filepath = await buildDocumentStoragePath('task', metadata.taskId, fileEntry.name)
  await uploadDocumentFile(event, filepath, fileEntry)

  try {
    const [attachment] = await db.insert(taskAttachmentsTable)
      .values(createTaskAttachmentInsertValues(fileEntry, filepath, metadata))
      .returning()

    if (!attachment) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Impossible d\'enregistrer la pièce jointe en base'
      })
    }

    return await withDocumentDownloadUrl(event, { ...attachment, filepath })
  } catch (error) {
    await deleteUploadedDocumentIfExists(event, filepath)
    throw error
  }
})
