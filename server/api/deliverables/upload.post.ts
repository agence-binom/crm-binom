import { db } from '~/db'
import { deliverablesTable } from '~/db/schema/deliverables'
import { deliverableUploadMetadataSchema } from '~/validation/deliverables'
import { buildDocumentStoragePath, uploadDocumentFile, withDocumentDownloadUrl, deleteUploadedDocumentIfExists } from '~~/server/utils/documents'
import { assertValidDeliverableFile } from '~~/server/utils/deliverables'
import { createDeliverableInsertValues } from '~~/server/lib/deliverables-upload'

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)
  const fileEntry = formData.get('file')

  if (!(fileEntry instanceof File)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Aucun fichier fourni'
    })
  }

  assertValidDeliverableFile(fileEntry)

  const metadata = deliverableUploadMetadataSchema.parse({
    projectId: formData.get('projectId'),
    name: formData.get('name'),
    description: formData.get('description')
  })

  const filepath = await buildDocumentStoragePath('project', metadata.projectId, fileEntry.name, 'deliverable')
  await uploadDocumentFile(event, filepath, fileEntry)

  try {
    const [deliverable] = await db.insert(deliverablesTable)
      .values(createDeliverableInsertValues(fileEntry, filepath, metadata))
      .returning()

    if (!deliverable) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Impossible d\'enregistrer le livrable en base'
      })
    }

    return await withDocumentDownloadUrl(event, { ...deliverable, filepath })
  } catch (error) {
    await deleteUploadedDocumentIfExists(event, filepath)
    throw error
  }
})
