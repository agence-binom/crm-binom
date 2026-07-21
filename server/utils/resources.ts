import { createError, type H3Event } from 'h3'
import { getResourceValidationError } from '~~/server/lib/resources-upload'
import { withDocumentDownloadUrl } from '~~/server/utils/documents'

type ResourceWithType = {
  type: string
  filepath: string | null
}

export const assertValidResourceFile = (file: File) => {
  const errorMessage = getResourceValidationError(file)
  if (errorMessage) {
    throw createError({
      statusCode: 400,
      statusMessage: errorMessage
    })
  }
}

export const withResourcesDownloadUrls = async <T extends ResourceWithType>(
  event: H3Event,
  resources: T[]
) => Promise.all(resources.map(async (resource) => {
  if (resource.type !== 'document' || !resource.filepath) {
    return { ...resource, downloadUrl: null }
  }

  return withDocumentDownloadUrl(event, { ...resource, filepath: resource.filepath })
}))
