import { z } from 'zod'

export const paymentCreateSchema = z.object({
  invoiceId: z.number().int('L\'ID facture doit être un entier').positive('L\'ID facture doit être positif'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant invalide'),
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum(['bank_transfer', 'check', 'cash', 'credit_card', 'other'], {
    message: 'Méthode de paiement invalide'
  }),
  type: z.enum(['payment', 'deposit', 'refund'], {
    message: 'Le type doit être "payment", "deposit" ou "refund"'
  }).default('payment'),
  reference: z.string().max(255, 'Référence trop longue').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
})

export const paymentUpdateSchema = z.object({
  invoiceId: z.number().int('L\'ID facture doit être un entier').positive('L\'ID facture doit être positif').optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant invalide').optional(),
  paymentDate: z.coerce.date().optional(),
  paymentMethod: z.enum(['bank_transfer', 'check', 'cash', 'credit_card', 'other'], {
    message: 'Méthode de paiement invalide'
  }).optional(),
  type: z.enum(['payment', 'deposit', 'refund'], {
    message: 'Le type doit être "payment", "deposit" ou "refund"'
  }).optional(),
  reference: z.string().max(255, 'Référence trop longue').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' }
)

export const paymentIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export type PaymentCreate = z.infer<typeof paymentCreateSchema>
export type PaymentUpdate = z.infer<typeof paymentUpdateSchema>
export type PaymentId = z.infer<typeof paymentIdSchema>
