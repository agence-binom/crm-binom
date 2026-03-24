import { z } from 'zod'

export const billingDashboardStatuses = [
  'all',
  'missing_quote_pdf',
  'missing_invoice_pdf',
  'missing_facturenet_link',
  'complete'
] as const

export const billingDashboardQuerySchema = z.object({
  search: z.string().trim().max(255, 'La recherche est trop longue').optional().default(''),
  status: z.enum(billingDashboardStatuses).default('all'),
  page: z.coerce.number().int('La page doit être un entier').positive('La page doit être positive').default(1),
  pageSize: z.coerce.number().int('La taille de page doit être un entier').min(1, 'La taille de page doit être positive').max(100, 'La taille de page est trop grande').default(12)
})

export type BillingDashboardQuery = z.infer<typeof billingDashboardQuerySchema>
