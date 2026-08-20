import { randomUUID } from 'node:crypto'
import { documentAcceptedMimeTypes, documentMaxSizeBytes, type DocumentUploadMetadata } from '../../app/validation/documents'

type FileLike = Pick<File, 'name' | 'size' | 'type'>

export const getDocumentValidationError = (
  file: Pick<FileLike, 'size' | 'type'>,
  options?: { acceptedMimeTypes?: readonly string[], maxSizeBytes?: number }
) => {
  const acceptedMimeTypes = options?.acceptedMimeTypes ?? documentAcceptedMimeTypes
  const maxSizeBytes = options?.maxSizeBytes ?? documentMaxSizeBytes

  if (!file.size) {
    return 'Le fichier est vide'
  }

  if (file.size > maxSizeBytes) {
    return `Le fichier dépasse la taille maximale autorisée de ${Math.round(maxSizeBytes / (1024 * 1024))} Mo`
  }

  if (!acceptedMimeTypes.includes(file.type)) {
    return 'Type de fichier non pris en charge'
  }

  return null
}

export const sanitizeDocumentPathSegment = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'document'
}

export const sanitizeDocumentFilename = (
  filename: string,
  uniqueId = randomUUID()
) => {
  const normalized = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const lastDotIndex = normalized.lastIndexOf('.')
  const rawName = lastDotIndex > 0 ? normalized.slice(0, lastDotIndex) : normalized
  const rawExtension = lastDotIndex > 0 ? normalized.slice(lastDotIndex + 1) : ''

  const basename = sanitizeDocumentPathSegment(rawName)

  const extension = rawExtension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 10)

  return extension
    ? `${basename}-${uniqueId}.${extension}`
    : `${basename}-${uniqueId}`
}

export const createDocumentInsertValues = (
  file: FileLike,
  filepath: string,
  metadata: DocumentUploadMetadata
) => ({
  name: metadata.name?.trim() || file.name,
  filename: file.name,
  filepath,
  externalUrl: metadata.externalUrl?.trim() || null,
  mimetype: file.type,
  size: file.size,
  entityType: metadata.entityType,
  entityId: metadata.entityId,
  documentType: metadata.documentType,
  status: metadata.status,
  subtype: metadata.subtype ?? null,
  description: metadata.description?.trim() || ''
})
