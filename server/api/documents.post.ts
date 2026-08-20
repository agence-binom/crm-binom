import { db } from '~/db'
import { documentsTable } from '~/db/schema/documents'
import { documentUploadMetadataSchema } from '~/validation/documents'
import { buildDocumentStoragePath, uploadDocumentFile, withDocumentDownloadUrl, deleteUploadedDocumentIfExists, assertValidDocumentFile } from '~~/server/utils/documents'
import { createDocumentInsertValues } from '~~/server/lib/documents-upload'

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)
  const fileEntry = formData.get('file')

  if (!(fileEntry instanceof File)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Aucun fichier fourni'
    })
  }

  assertValidDocumentFile(fileEntry)

  const metadata = documentUploadMetadataSchema.parse({
    entityType: formData.get('entityType'),
    entityId: formData.get('entityId'),
    documentType: formData.get('documentType'),
    externalUrl: formData.get('externalUrl'),
    name: formData.get('name'),
    description: formData.get('description'),
    subtype: formData.get('subtype') || undefined
  })

  const filepath = await buildDocumentStoragePath(
    metadata.entityType,
    metadata.entityId,
    fileEntry.name,
    metadata.documentType
  )
  await uploadDocumentFile(event, filepath, fileEntry)

  try {
    const [document] = await db.insert(documentsTable)
      .values(createDocumentInsertValues(fileEntry, filepath, metadata))
      .returning()

    if (!document) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Impossible d\'enregistrer le document en base'
      })
    }

    return await withDocumentDownloadUrl(event, document)
  } catch (error) {
    await deleteUploadedDocumentIfExists(event, filepath)
    throw error
  }
})
