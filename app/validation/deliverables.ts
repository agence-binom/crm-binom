import { z } from 'zod'

export const deliverableAcceptedMimeTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] as const

export const deliverableMaxSizeBytes = 10 * 1024 * 1024
export const deliverableFileInputAccept = deliverableAcceptedMimeTypes.join(',')

// A deliverable link is rendered as a clickable href straight from the database (DeliverablesCard,
// both in the admin app and the client portal) - restricting to http/https at the schema level is
// what stops a `javascript:`/`data:` URL from ever being persisted and later executed on click.
const isHttpUrl = (value: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

const deliverableUrlSchema = z.url('Le lien doit être une URL valide')
  .max(2048, 'Le lien est trop long')
  .refine(isHttpUrl, 'Le lien doit utiliser le protocole http ou https')

export const deliverableCreateSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('link'),
    projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif'),
    name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
    description: z.string().optional().or(z.literal('')),
    url: deliverableUrlSchema
  }),
  z.object({
    type: z.literal('text'),
    projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif'),
    name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
    description: z.string().optional().or(z.literal('')),
    content: z.string().min(1, 'Le contenu est requis')
  })
])

export const deliverableUploadMetadataSchema = z.object({
  projectId: z.coerce.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif'),
  name: z.string().trim().max(255, 'Le nom est trop long').optional().or(z.literal('')),
  description: z.string().trim().max(1000, 'La description est trop longue').optional().or(z.literal(''))
})

export const deliverableUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional(),
  description: z.string().optional().or(z.literal('')),
  url: deliverableUrlSchema.optional(),
  content: z.string().min(1, 'Le contenu ne peut pas être vide').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni'
})

export const deliverableIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export const deliverableListQuerySchema = z.object({
  projectId: z.coerce.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional()
})

export type DeliverableCreate = z.infer<typeof deliverableCreateSchema>
export type DeliverableUpdate = z.infer<typeof deliverableUpdateSchema>
export type DeliverableId = z.infer<typeof deliverableIdSchema>
export type DeliverableUploadMetadata = z.infer<typeof deliverableUploadMetadataSchema>
