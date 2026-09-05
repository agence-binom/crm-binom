import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { resourceUploadMetadataSchema } from '~/validation/resources'
import { buildDocumentStoragePath, uploadDocumentFile, withDocumentDownloadUrl, deleteUploadedDocumentIfExists } from '~~/server/utils/documents'
import { assertValidResourceFile } from '~~/server/utils/resources'
import { createResourceInsertValues } from '~~/server/lib/resources-upload'
import { getPortalClient, requirePortalProject } from '~~/server/utils/client-portal'

export default defineEventHandler(async (event) => {
  const client = getPortalClient(event)
  const formData = await readFormData(event)
  const fileEntry = formData.get('file')

  if (!(fileEntry instanceof File)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Aucun fichier fourni'
    })
  }

  assertValidResourceFile(fileEntry)

  const metadata = resourceUploadMetadataSchema.parse({
    projectId: formData.get('projectId'),
    name: formData.get('name'),
    description: formData.get('description')
  })

  await requirePortalProject(client.id, metadata.projectId)

  const filepath = await buildDocumentStoragePath('project', metadata.projectId, fileEntry.name, 'resource')
  await uploadDocumentFile(event, filepath, fileEntry)

  try {
    const [resource] = await db.insert(resourcesTable)
      .values(createResourceInsertValues(fileEntry, filepath, metadata))
      .returning()

    if (!resource) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Impossible d\'enregistrer la ressource en base'
      })
    }

    return await withDocumentDownloadUrl(event, { ...resource, filepath })
  } catch (error) {
    await deleteUploadedDocumentIfExists(event, filepath)
    throw error
  }
})
