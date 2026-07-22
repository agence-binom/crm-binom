import { z } from 'zod'

export const resourceAcceptedMimeTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] as const

export const resourceMaxSizeBytes = 10 * 1024 * 1024
export const resourceFileInputAccept = resourceAcceptedMimeTypes.join(',')

const resourceOwnerFields = {
  projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional(),
  taskId: z.number().int('L\'ID tâche doit être un entier').positive('L\'ID tâche doit être positif').optional()
}

const nullableIdFromFormData = (label: string) => z.preprocess(
  value => (value === null || value === '' || value === undefined ? undefined : value),
  z.coerce.number().int(`L'ID ${label} doit être un entier`).positive(`L'ID ${label} doit être positif`)
).optional()

const refineResourceOwner = (data: { projectId?: number, taskId?: number }, ctx: z.RefinementCtx) => {
  const ownerCount = [data.projectId, data.taskId].filter(value => value != null).length
  if (ownerCount !== 1) {
    ctx.addIssue({
      code: 'custom',
      path: ['projectId'],
      message: 'La ressource doit être rattachée à un projet ou à une tâche'
    })
  }
}

export const resourceCreateSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('link'),
    ...resourceOwnerFields,
    name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
    description: z.string().optional().or(z.literal('')),
    url: z.url('Le lien doit être une URL valide').max(2048, 'Le lien est trop long')
  }),
  z.object({
    type: z.literal('text'),
    ...resourceOwnerFields,
    name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
    description: z.string().optional().or(z.literal('')),
    content: z.string().min(1, 'Le contenu est requis')
  })
]).superRefine(refineResourceOwner)

export const resourceUploadMetadataSchema = z.object({
  projectId: nullableIdFromFormData('projet'),
  taskId: nullableIdFromFormData('tâche'),
  name: z.string().trim().max(255, 'Le nom est trop long').optional().or(z.literal('')),
  description: z.string().trim().max(1000, 'La description est trop longue').optional().or(z.literal(''))
}).superRefine(refineResourceOwner)

export const resourceUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional(),
  description: z.string().optional().or(z.literal('')),
  url: z.url('Le lien doit être une URL valide').max(2048, 'Le lien est trop long').optional(),
  content: z.string().min(1, 'Le contenu ne peut pas être vide').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni'
})

export const resourceIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export const resourceListQuerySchema = z.object({
  projectId: z.coerce.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional(),
  taskId: z.coerce.number().int('L\'ID tâche doit être un entier').positive('L\'ID tâche doit être positif').optional()
})

export type ResourceCreate = z.infer<typeof resourceCreateSchema>
export type ResourceUpdate = z.infer<typeof resourceUpdateSchema>
export type ResourceId = z.infer<typeof resourceIdSchema>
export type ResourceUploadMetadata = z.infer<typeof resourceUploadMetadataSchema>
