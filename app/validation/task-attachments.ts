import { z } from 'zod'

export const taskAttachmentAcceptedMimeTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] as const

export const taskAttachmentMaxSizeBytes = 10 * 1024 * 1024
export const taskAttachmentFileInputAccept = taskAttachmentAcceptedMimeTypes.join(',')

export const taskAttachmentCreateSchema = z.object({
  type: z.literal('link'),
  taskId: z.number().int('L\'ID tâche doit être un entier').positive('L\'ID tâche doit être positif'),
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  description: z.string().optional().or(z.literal('')),
  url: z.url('Le lien doit être une URL valide').max(2048, 'Le lien est trop long')
})

export const taskAttachmentUploadMetadataSchema = z.object({
  taskId: z.coerce.number().int('L\'ID tâche doit être un entier').positive('L\'ID tâche doit être positif'),
  name: z.string().trim().max(255, 'Le nom est trop long').optional().or(z.literal('')),
  description: z.string().trim().max(1000, 'La description est trop longue').optional().or(z.literal(''))
})

export const taskAttachmentUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional(),
  description: z.string().optional().or(z.literal('')),
  url: z.url('Le lien doit être une URL valide').max(2048, 'Le lien est trop long').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni'
})

export const taskAttachmentIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export const taskAttachmentListQuerySchema = z.object({
  taskId: z.coerce.number().int('L\'ID tâche doit être un entier').positive('L\'ID tâche doit être positif')
})

export type TaskAttachmentCreate = z.infer<typeof taskAttachmentCreateSchema>
export type TaskAttachmentUpdate = z.infer<typeof taskAttachmentUpdateSchema>
export type TaskAttachmentId = z.infer<typeof taskAttachmentIdSchema>
export type TaskAttachmentUploadMetadata = z.infer<typeof taskAttachmentUploadMetadataSchema>
