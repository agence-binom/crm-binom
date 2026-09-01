import { z } from 'zod'

export const billingDocumentTypes = ['quote', 'invoice', 'commercial_proposal'] as const
export const documentStatuses = ['draft', 'sent', 'completed', 'cancelled', 'refused', 'non_applicable'] as const
export const invoiceSubtypes = ['acompte', 'solde', 'unique', 'avoir'] as const

// Valid states per document type, per the Figma state-machine spec. `invoice` covers both the
// 'acompte' and 'unique'/'solde' subtypes — they share the exact same set of valid states.
export const documentStatusesByType: Record<typeof billingDocumentTypes[number], readonly typeof documentStatuses[number][]> = {
  commercial_proposal: ['draft', 'sent', 'refused', 'completed', 'cancelled'],
  quote: ['draft', 'sent', 'refused', 'completed', 'cancelled', 'non_applicable'],
  invoice: ['draft', 'sent', 'completed', 'cancelled', 'non_applicable']
}

const documentExternalUrlSchema = z.url('Le lien Facture.net doit être une URL valide')
  .max(2048, 'Le lien Facture.net est trop long')
  .optional()
  .or(z.literal(''))

export const isFactureNetUrl = (value: string) => {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && /(^|\.)facture\.net$/i.test(url.hostname)
  } catch {
    return false
  }
}

const documentTypesRequiringFactureNetLink = ['quote', 'invoice'] as const

const refineBillingDocument = (
  data: { documentType?: typeof billingDocumentTypes[number], externalUrl?: string, subtype?: string, status?: typeof documentStatuses[number] },
  ctx: z.RefinementCtx
) => {
  if (data.subtype && data.documentType && data.documentType !== 'invoice') {
    ctx.addIssue({
      code: 'custom',
      path: ['subtype'],
      message: 'Le sous-type n\'est disponible que pour les factures'
    })
  }

  if (data.status && data.documentType && !documentStatusesByType[data.documentType].includes(data.status)) {
    ctx.addIssue({
      code: 'custom',
      path: ['status'],
      message: 'Ce statut n\'est pas valide pour ce type de document'
    })
  }

  if (!data.documentType || !documentTypesRequiringFactureNetLink.includes(data.documentType as typeof documentTypesRequiringFactureNetLink[number])) {
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

// Creates a billing step record with no attached file yet (status/date/description only).
export const billingDocumentCreateSchema = z.object({
  projectId: z.coerce.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif'),
  documentType: z.enum(billingDocumentTypes),
  subtype: z.enum(invoiceSubtypes).optional(),
  status: z.enum(documentStatuses).optional().default('draft'),
  statusDate: z.coerce.date().optional(),
  externalUrl: documentExternalUrlSchema.optional(),
  description: z.string().optional().or(z.literal(''))
}).superRefine(refineBillingDocument)

// Metadata for the "upload a file for this billing step" multipart route. Deliberately excludes
// `status` — the workflow status of a step is never implied by uploading its file.
export const billingDocumentUploadMetadataSchema = z.object({
  projectId: z.coerce.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif'),
  documentType: z.enum(billingDocumentTypes),
  subtype: z.enum(invoiceSubtypes).optional(),
  externalUrl: documentExternalUrlSchema.optional(),
  name: z.string().trim().max(255, 'Le nom est trop long').optional().or(z.literal('')),
  description: z.string().trim().max(1000, 'La description est trop longue').optional().or(z.literal(''))
}).superRefine(refineBillingDocument)

// `documentType`/`subtype`/`projectId` are the step's identity and never change after creation.
export const billingDocumentUpdateSchema = z.object({
  status: z.enum(documentStatuses).optional(),
  statusDate: z.coerce.date().optional(),
  externalUrl: documentExternalUrlSchema.optional(),
  description: z.string().optional().or(z.literal('')),
  documentId: z.number().int().positive().nullable().optional()
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' }
)

export const billingDocumentIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export const billingDocumentProjectParamsSchema = z.object({
  projectId: z.coerce.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif')
})

export type BillingDocumentCreate = z.infer<typeof billingDocumentCreateSchema>
export type BillingDocumentUpdate = z.infer<typeof billingDocumentUpdateSchema>
export type BillingDocumentUploadMetadata = z.infer<typeof billingDocumentUploadMetadataSchema>
