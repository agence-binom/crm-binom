export const FACTURE_NET_PORTAL_LINKS = {
  quotes: 'https://www.facture.net/376761/quotations',
  invoices: 'https://www.facture.net/376761/invoices'
} as const

// Mirrors `BillingStatus.tone` (app/lib/documents.ts) - the "Statut" column's badge tone
// doubles as the dashboard's status filter, so there is exactly one status vocabulary instead of
// a separate one for filtering vs. display.
export const billingDashboardStatuses = [
  'all',
  'neutral',
  'warning',
  'success',
  'muted'
] as const

export type BillingDashboardStatus = typeof billingDashboardStatuses[number]
