import { getDocumentValidationError } from './documents-upload'
import { deliverableAcceptedMimeTypes, deliverableMaxSizeBytes, type DeliverableUploadMetadata } from '../../app/validation/deliverables'

type FileLike = Pick<File, 'name' | 'size' | 'type'>

export const getDeliverableValidationError = (file: Pick<FileLike, 'size' | 'type'>) => getDocumentValidationError(file, {
  acceptedMimeTypes: deliverableAcceptedMimeTypes,
  maxSizeBytes: deliverableMaxSizeBytes
})

export const createDeliverableInsertValues = (
  file: FileLike,
  filepath: string,
  metadata: DeliverableUploadMetadata
) => ({
  projectId: metadata.projectId,
  type: 'document' as const,
  name: metadata.name?.trim() || file.name,
  description: metadata.description?.trim() || null,
  filename: file.name,
  filepath,
  mimetype: file.type,
  size: file.size,
  url: null,
  content: null
})
