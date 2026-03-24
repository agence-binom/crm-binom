export const FACTURE_NET_PORTAL_LINKS = {
  quotes: 'https://www.facture.net/376761/quotations',
  invoices: 'https://www.facture.net/376761/invoices'
} as const

export const billingDashboardStatuses = [
  'all',
  'missing_quote_pdf',
  'missing_invoice_pdf',
  'missing_facturenet_link',
  'complete'
] as const

export type BillingDashboardStatus = typeof billingDashboardStatuses[number]
