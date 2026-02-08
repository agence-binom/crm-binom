import { z } from 'zod'

export const quoteCreateSchema = z.object({
  clientId: z.number().int('L\'ID client doit être un entier').positive('L\'ID client doit être positif'),
  projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional(),
  number: z.string().min(1, 'Le numéro de devis est requis').max(50, 'Le numéro est trop long'),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired'], {
    message: 'Le statut doit être "draft", "sent", "accepted", "rejected" ou "expired"'
  }).default('draft'),
  totalHT: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant HT invalide'),
  totalTTC: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant TTC invalide'),
  vatRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Taux TVA invalide').default('20'),
  issueDate: z.coerce.date(),
  validUntil: z.coerce.date().optional(),
  notes: z.string().optional().or(z.literal('')),
  terms: z.string().optional().or(z.literal(''))
})

export const quoteUpdateSchema = z.object({
  clientId: z.number().int('L\'ID client doit être un entier').positive('L\'ID client doit être positif').optional(),
  projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional(),
  number: z.string().min(1, 'Le numéro ne peut pas être vide').max(50, 'Le numéro est trop long').optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired'], {
    message: 'Le statut doit être "draft", "sent", "accepted", "rejected" ou "expired"'
  }).optional(),
  totalHT: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant HT invalide').optional(),
  totalTTC: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant TTC invalide').optional(),
  vatRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Taux TVA invalide').optional(),
  issueDate: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  notes: z.string().optional().or(z.literal('')),
  terms: z.string().optional().or(z.literal(''))
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' }
)

export const quoteIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export type QuoteCreate = z.infer<typeof quoteCreateSchema>
export type QuoteUpdate = z.infer<typeof quoteUpdateSchema>
export type QuoteId = z.infer<typeof quoteIdSchema>
