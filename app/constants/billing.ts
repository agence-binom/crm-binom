export const FACTURE_NET_PORTAL_LINKS = {
  quotes: 'https://www.facture.net/376761/quotations',
  invoices: 'https://www.facture.net/376761/invoices'
} as const

// Mostly mirrors `BillingStatus.tone` (app/lib/documents.ts) - the "Statut" column's badge tone
// doubles as the dashboard's status filter, so there is exactly one status vocabulary instead of
// a separate one for filtering vs. display. `active` is the one addition: it has no matching tone
// and instead groups `neutral` + `warning` (billing still "en cours"), so the dashboard can default
// to hiding closed (`success`) and dead (`muted`) projects without a second filter control.
export const billingDashboardStatuses = [
  'all',
  'active',
  'neutral',
  'warning',
  'success',
  'muted'
] as const

export type BillingDashboardStatus = typeof billingDashboardStatuses[number]

// The tones grouped under `active`, defined once so its membership can't drift between the
// server-side filter and the dashboard's own "all caught up" check.
const activeBillingTones = ['neutral', 'warning'] as const

export const isActiveBillingTone = (tone: string): boolean =>
  (activeBillingTones as readonly string[]).includes(tone)
