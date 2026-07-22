import { getDocumentValidationError } from './documents-upload'
import { resourceAcceptedMimeTypes, resourceMaxSizeBytes, type ResourceUploadMetadata } from '../../app/validation/resources'

type FileLike = Pick<File, 'name' | 'size' | 'type'>

export const getResourceValidationError = (file: Pick<FileLike, 'size' | 'type'>) => getDocumentValidationError(file, {
  acceptedMimeTypes: resourceAcceptedMimeTypes,
  maxSizeBytes: resourceMaxSizeBytes
})

export const createResourceInsertValues = (
  file: FileLike,
  filepath: string,
  metadata: ResourceUploadMetadata
) => ({
  projectId: metadata.projectId ?? null,
  taskId: metadata.taskId ?? null,
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
