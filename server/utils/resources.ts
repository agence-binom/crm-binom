import { createError } from 'h3'
import { getResourceValidationError } from '~~/server/lib/resources-upload'
import { withOptionalDocumentDownloadUrls } from '~~/server/utils/documents'

export const assertValidResourceFile = (file: File) => {
  const errorMessage = getResourceValidationError(file)
  if (errorMessage) {
    throw createError({
      statusCode: 400,
      statusMessage: errorMessage
    })
  }
}

export const withResourcesDownloadUrls = withOptionalDocumentDownloadUrls
