import { getDocumentValidationError } from './documents-upload'
import { taskAttachmentAcceptedMimeTypes, taskAttachmentMaxSizeBytes, type TaskAttachmentUploadMetadata } from '../../app/validation/task-attachments'

type FileLike = Pick<File, 'name' | 'size' | 'type'>

export const getTaskAttachmentValidationError = (file: Pick<FileLike, 'size' | 'type'>) => getDocumentValidationError(file, {
  acceptedMimeTypes: taskAttachmentAcceptedMimeTypes,
  maxSizeBytes: taskAttachmentMaxSizeBytes
})

export const createTaskAttachmentInsertValues = (
  file: FileLike,
  filepath: string,
  metadata: TaskAttachmentUploadMetadata
) => ({
  taskId: metadata.taskId,
  type: 'document' as const,
  name: metadata.name?.trim() || file.name,
  description: metadata.description?.trim() || null,
  filename: file.name,
  filepath,
  mimetype: file.type,
  size: file.size,
  url: null
})
