import { createError } from 'h3'
import { getTaskAttachmentValidationError } from '~~/server/lib/task-attachments-upload'
import { withOptionalDocumentDownloadUrls } from '~~/server/utils/documents'

export const assertValidTaskAttachmentFile = (file: File) => {
  const errorMessage = getTaskAttachmentValidationError(file)
  if (errorMessage) {
    throw createError({
      statusCode: 400,
      statusMessage: errorMessage
    })
  }
}

export const withTaskAttachmentsDownloadUrls = withOptionalDocumentDownloadUrls
