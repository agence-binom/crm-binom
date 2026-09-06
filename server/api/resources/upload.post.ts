import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { resourceUploadMetadataSchema } from '~/validation/resources'
import { buildDocumentStoragePath, uploadDocumentFile, withDocumentDownloadUrl, deleteUploadedDocumentIfExists } from '~~/server/utils/documents'
import { assertValidResourceFile } from '~~/server/utils/resources'
import { createResourceInsertValues } from '~~/server/lib/resources-upload'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
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

  const filepath = await buildDocumentStoragePath('project', metadata.projectId, fileEntry.name, 'resource')
  await uploadDocumentFile(event, filepath, fileEntry)

  try {
    const [resource] = await db.insert(resourcesTable)
      .values({ ...createResourceInsertValues(fileEntry, filepath, metadata), createdByUserId: getAppUser(event).id })
      .returning()

    if (!resource) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Impossible d\'enregistrer la ressource en base'
      })
    }

    void logActivity(event, { entityType: 'resource', entityId: resource.id, action: 'create', metadata: { name: resource.name } })

    return await withDocumentDownloadUrl(event, { ...resource, filepath })
  } catch (error) {
    await deleteUploadedDocumentIfExists(event, filepath)
    throw error
  }
})
