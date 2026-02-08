import { z } from 'zod'

export const invoiceCreateSchema = z.object({
  clientId: z.number().int('L\'ID client doit être un entier').positive('L\'ID client doit être positif'),
  projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional(),
  quoteId: z.number().int('L\'ID devis doit être un entier').positive('L\'ID devis doit être positif').optional(),
  number: z.string().min(1, 'Le numéro de facture est requis').max(50, 'Le numéro est trop long'),
  status: z.enum(['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'], {
    message: 'Le statut doit être "draft", "sent", "paid", "partial", "overdue" ou "cancelled"'
  }).default('draft'),
  totalHT: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant HT invalide'),
  totalTTC: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant TTC invalide'),
  vatRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Taux TVA invalide').default('20'),
  paidAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant payé invalide').default('0'),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  paidDate: z.coerce.date().optional(),
  notes: z.string().optional().or(z.literal('')),
  terms: z.string().optional().or(z.literal(''))
})

export const invoiceUpdateSchema = z.object({
  clientId: z.number().int('L\'ID client doit être un entier').positive('L\'ID client doit être positif').optional(),
  projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional(),
  quoteId: z.number().int('L\'ID devis doit être un entier').positive('L\'ID devis doit être positif').optional(),
  number: z.string().min(1, 'Le numéro ne peut pas être vide').max(50, 'Le numéro est trop long').optional(),
  status: z.enum(['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'], {
    message: 'Le statut doit être "draft", "sent", "paid", "partial", "overdue" ou "cancelled"'
  }).optional(),
  totalHT: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant HT invalide').optional(),
  totalTTC: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant TTC invalide').optional(),
  vatRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Taux TVA invalide').optional(),
  paidAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant payé invalide').optional(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  paidDate: z.coerce.date().optional(),
  notes: z.string().optional().or(z.literal('')),
  terms: z.string().optional().or(z.literal(''))
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' }
)

export const invoiceIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export type InvoiceCreate = z.infer<typeof invoiceCreateSchema>
export type InvoiceUpdate = z.infer<typeof invoiceUpdateSchema>
export type InvoiceId = z.infer<typeof invoiceIdSchema>
