import { z } from 'zod'

// Generic file attachments — currently only used by billing uploads (entityType 'project'), kept
// generic since it's plain storage metadata with no reason to be billing-specific.
export const documentEntityTypes = ['project', 'client', 'task', 'resource'] as const

export const documentAcceptedMimeTypes = [
  'application/pdf'
] as const

export const documentMaxSizeBytes = 10 * 1024 * 1024
export const documentFileInputAccept = documentAcceptedMimeTypes.join(',')

export const documentUploadMetadataSchema = z.object({
  entityType: z.enum(documentEntityTypes, {
    message: 'Le type d\'entité doit être "project", "client", "task" ou "resource"'
  }),
  entityId: z.coerce.number().int('L\'ID entité doit être un entier').positive('L\'ID entité doit être positif'),
  name: z.string().trim().max(255, 'Le nom est trop long').optional().or(z.literal('')),
  description: z.string().trim().max(1000, 'La description est trop longue').optional().or(z.literal(''))
})

export const documentUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional(),
  description: z.string().optional().or(z.literal(''))
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' }
)

export const documentIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export const documentEntityParamsSchema = z.object({
  entityType: z.enum(documentEntityTypes, {
    message: 'Le type d\'entité doit être "project", "client", "task" ou "resource"'
  }),
  entityId: z.coerce.number().int('L\'ID entité doit être un entier').positive('L\'ID entité doit être positif')
})

export type DocumentUpdate = z.infer<typeof documentUpdateSchema>
export type DocumentId = z.infer<typeof documentIdSchema>
export type DocumentUploadMetadata = z.infer<typeof documentUploadMetadataSchema>
