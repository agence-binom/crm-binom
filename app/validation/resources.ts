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

// A resource link is rendered as a clickable href straight from the database (ResourcesCard, both
// in the admin app and the client portal) - restricting to http/https at the schema level is what
// stops a `javascript:`/`data:` URL from ever being persisted and later executed on click.
const isHttpUrl = (value: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

const resourceUrlSchema = z.url('Le lien doit être une URL valide')
  .max(2048, 'Le lien est trop long')
  .refine(isHttpUrl, 'Le lien doit utiliser le protocole http ou https')

export const resourceCreateSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('link'),
    projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif'),
    name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
    description: z.string().optional().or(z.literal('')),
    url: resourceUrlSchema
  }),
  z.object({
    type: z.literal('text'),
    projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif'),
    name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
    description: z.string().optional().or(z.literal('')),
    content: z.string().min(1, 'Le contenu est requis')
  })
])

export const resourceUploadMetadataSchema = z.object({
  projectId: z.coerce.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif'),
  name: z.string().trim().max(255, 'Le nom est trop long').optional().or(z.literal('')),
  description: z.string().trim().max(1000, 'La description est trop longue').optional().or(z.literal(''))
})

export const resourceUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional(),
  description: z.string().optional().or(z.literal('')),
  url: resourceUrlSchema.optional(),
  content: z.string().min(1, 'Le contenu ne peut pas être vide').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni'
})

export const resourceIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export const resourceListQuerySchema = z.object({
  projectId: z.coerce.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional()
})

export type ResourceCreate = z.infer<typeof resourceCreateSchema>
export type ResourceUpdate = z.infer<typeof resourceUpdateSchema>
export type ResourceId = z.infer<typeof resourceIdSchema>
export type ResourceUploadMetadata = z.infer<typeof resourceUploadMetadataSchema>
