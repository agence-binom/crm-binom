import { z } from 'zod'

export const documentEntityTypes = ['quote', 'invoice', 'project', 'client'] as const
export const billingDocumentTypes = ['quote', 'invoice'] as const

export const documentAcceptedMimeTypes = [
  'application/pdf'
] as const

export const documentMaxSizeBytes = 10 * 1024 * 1024
export const documentFileInputAccept = documentAcceptedMimeTypes.join(',')

const documentExternalUrlSchema = z.url('Le lien Facture.net doit être une URL valide')
  .max(2048, 'Le lien Facture.net est trop long')
  .optional()

export const isFactureNetUrl = (value: string) => {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && /(^|\.)facture\.net$/i.test(url.hostname)
  } catch {
    return false
  }
}

const refineBillingDocumentSource = (
  data: { documentType?: typeof billingDocumentTypes[number], externalUrl?: string },
  ctx: z.RefinementCtx
) => {
  if (!data.documentType) {
    return
  }

  const externalUrl = data.externalUrl?.trim() || ''

  if (!externalUrl) {
    ctx.addIssue({
      code: 'custom',
      path: ['externalUrl'],
      message: 'Le lien Facture.net est requis pour un devis ou une facture'
    })
    return
  }

  if (!isFactureNetUrl(externalUrl)) {
    ctx.addIssue({
      code: 'custom',
      path: ['externalUrl'],
      message: 'Le lien doit pointer vers une page Facture.net'
    })
  }
}

export const documentCreateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  filename: z.string().min(1, 'Le nom du fichier est requis').max(255, 'Le nom du fichier est trop long'),
  filepath: z.string().min(1, 'Le chemin est requis').max(500, 'Le chemin est trop long'),
  externalUrl: documentExternalUrlSchema,
  mimetype: z.string().min(1, 'Le type MIME est requis').max(100, 'Le type MIME est trop long'),
  size: z.number().int('La taille doit être un entier').positive('La taille doit être positive'),
  entityType: z.enum(documentEntityTypes, {
    message: 'Le type d\'entité doit être "quote", "invoice", "project" ou "client"'
  }),
  entityId: z.number().int('L\'ID entité doit être un entier').positive('L\'ID entité doit être positif'),
  documentType: z.enum(billingDocumentTypes).optional(),
  description: z.string().optional().or(z.literal(''))
}).superRefine(refineBillingDocumentSource)

export const documentUploadMetadataSchema = z.object({
  entityType: z.enum(documentEntityTypes, {
    message: 'Le type d\'entité doit être "quote", "invoice", "project" ou "client"'
  }),
  entityId: z.coerce.number().int('L\'ID entité doit être un entier').positive('L\'ID entité doit être positif'),
  documentType: z.enum(billingDocumentTypes).optional(),
  externalUrl: documentExternalUrlSchema,
  name: z.string().trim().max(255, 'Le nom est trop long').optional().or(z.literal('')),
  description: z.string().trim().max(1000, 'La description est trop longue').optional().or(z.literal(''))
}).superRefine(refineBillingDocumentSource)

export const documentUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional(),
  filename: z.string().min(1, 'Le nom du fichier ne peut pas être vide').max(255, 'Le nom du fichier est trop long').optional(),
  filepath: z.string().min(1, 'Le chemin ne peut pas être vide').max(500, 'Le chemin est trop long').optional(),
  externalUrl: documentExternalUrlSchema,
  mimetype: z.string().min(1, 'Le type MIME ne peut pas être vide').max(100, 'Le type MIME est trop long').optional(),
  size: z.number().int('La taille doit être un entier').positive('La taille doit être positive').optional(),
  entityType: z.enum(documentEntityTypes, {
    message: 'Le type d\'entité doit être "quote", "invoice", "project" ou "client"'
  }).optional(),
  entityId: z.number().int('L\'ID entité doit être un entier').positive('L\'ID entité doit être positif').optional(),
  documentType: z.enum(billingDocumentTypes).optional(),
  description: z.string().optional().or(z.literal(''))
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' }
).superRefine(refineBillingDocumentSource)

export const documentIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export const documentEntityParamsSchema = z.object({
  entityType: z.enum(documentEntityTypes, {
    message: 'Le type d\'entité doit être "quote", "invoice", "project" ou "client"'
  }),
  entityId: z.coerce.number().int('L\'ID entité doit être un entier').positive('L\'ID entité doit être positif')
})

export const documentListQuerySchema = z.object({
  documentType: z.enum(billingDocumentTypes).optional()
})

export type DocumentCreate = z.infer<typeof documentCreateSchema>
export type DocumentUpdate = z.infer<typeof documentUpdateSchema>
export type DocumentId = z.infer<typeof documentIdSchema>
export type DocumentUploadMetadata = z.infer<typeof documentUploadMetadataSchema>
