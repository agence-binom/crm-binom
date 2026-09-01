import { invoiceSubtypes, type documentStatuses } from '../validation/billing-documents'

export type DocumentStatus = typeof documentStatuses[number]
export type BillingDocumentType = 'quote' | 'invoice' | 'commercial_proposal'
export type InvoiceSubtype = typeof invoiceSubtypes[number]

// Labels per the Figma state-machine spec. Partial because not every status applies to every type
// (e.g. only proposal/quote can be "refused", only quote/invoice can be "non_applicable") - use
// `documentStatusesByType` to know which keys are actually populated for a given type.
export const documentStatusLabels: Record<BillingDocumentType, Partial<Record<DocumentStatus, string>>> = {
  commercial_proposal: {
    draft: 'À émettre',
    sent: 'En attente de validation',
    refused: 'Refusée',
    completed: 'Validée',
    cancelled: 'Annulée'
  },
  quote: {
    draft: 'À émettre',
    sent: 'En attente de validation',
    refused: 'Refusée',
    completed: 'Validée',
    cancelled: 'Annulée',
    non_applicable: 'Non applicable'
  },
  invoice: {
    draft: 'À émettre',
    sent: 'En attente de paiement',
    completed: 'Validée',
    cancelled: 'Annulée',
    non_applicable: 'Non applicable'
  }
}

// Cancelled/refused rank below draft so they never overshadow a genuinely advancing sibling document
// (e.g. a rejected "acompte" shouldn't hide that the "solde" is progressing) when computing a group's stage.
// This ranking only feeds the legacy coverage "stage" metric (`getBillingCoverage`) - the cascade logic
// below (`computeProjectBillingSteps`) has its own, separate rules.
const documentStatusRank: Record<DocumentStatus, number> = {
  cancelled: -1,
  refused: -1,
  non_applicable: 0,
  draft: 0,
  sent: 1,
  completed: 2
}

export const getMostAdvancedDocumentStatus = (statuses: DocumentStatus[]): DocumentStatus | null => {
  const [firstStatus, ...restStatuses] = statuses

  if (!firstStatus) return null

  return restStatuses.reduce((best, status) =>
    documentStatusRank[status] > documentStatusRank[best] ? status : best, firstStatus)
}

export const billingDocumentTypeIcons: Record<BillingDocumentType, string> = {
  commercial_proposal: 'i-lucide-file-text',
  quote: 'i-lucide-file-signature',
  invoice: 'i-lucide-receipt'
}

export const billingDocumentTypeLabels: Record<BillingDocumentType, string> = {
  commercial_proposal: 'Proposition commerciale',
  quote: 'Devis',
  invoice: 'Facture'
}

export const getDocumentDownloadHref = (document: { downloadUrl?: string | null, filepath?: string | null }) => {
  if (document.downloadUrl) return document.downloadUrl
  return document.filepath?.startsWith('http') ? document.filepath : undefined
}

export const getDocumentFactureNetHref = (document: { externalUrl?: string | null }) => {
  if (!document.externalUrl) return undefined
  return document.externalUrl.startsWith('http') ? document.externalUrl : undefined
}

// Only quote and invoice steps go through Facture.net — the commercial proposal doesn't.
export const billingDocumentTypesRequiringFactureNetLink: readonly BillingDocumentType[] = ['quote', 'invoice']

// A step past "draft" is expected to have its paperwork in order: once it's been sent, validated
// or refused, the PDF (and, for quote/invoice, the Facture.net link) should be attached; once it's
// completed, cancelled or refused, the date that happened should be recorded. Surfaces what's still
// missing so it can replace the description in red instead of failing silently.
const statusesRequiringFile: DocumentStatus[] = ['sent', 'completed', 'refused']
const statusesRequiringDate: DocumentStatus[] = ['completed', 'cancelled', 'refused']

export const getDocumentWarning = (document: {
  type: BillingDocumentType
  status: DocumentStatus
  hasFile: boolean
  hasLink: boolean
  statusDate?: string | Date | null
}): string | null => {
  const missing: string[] = []
  const requiresFactureNetLink = billingDocumentTypesRequiringFactureNetLink.includes(document.type)

  if (statusesRequiringFile.includes(document.status)) {
    if (!document.hasFile) missing.push('PDF manquant')
    if (requiresFactureNetLink && !document.hasLink) missing.push('Lien Facture.net manquant')
  }

  if (statusesRequiringDate.includes(document.status) && !document.statusDate) {
    missing.push('Date manquante')
  }

  return missing.length > 0 ? missing.join(' · ') : null
}

export const invoiceSubtypeLabels: Record<InvoiceSubtype, string> = {
  acompte: 'Facture d\'acompte',
  solde: 'Facture de solde',
  unique: 'Facture',
  avoir: 'Avoir'
}

// Invoices created before the subtype field existed (or left unset) behave as a single, standalone invoice.
export const getEffectiveInvoiceSubtype = (
  document: { type: BillingDocumentType, subtype?: string | null }
): InvoiceSubtype | null => {
  if (document.type !== 'invoice') return null

  const subtype = document.subtype as InvoiceSubtype | null | undefined
  return subtype && (invoiceSubtypes as readonly string[]).includes(subtype) ? subtype : 'unique'
}

export type DocumentLifecycle = 'current' | 'superseded'

export type LifecycleAnnotatedDocument<
  T extends { id: number, type: BillingDocumentType, subtype?: string | null, createdAt?: string | Date | null }
> = T & { lifecycle: DocumentLifecycle, supersededByDocumentId: number | null }

const getLifecycleGroupKey = (document: { id: number, type: BillingDocumentType, subtype?: string | null }): string => {
  if (document.type !== 'invoice') return document.type

  const effectiveSubtype = getEffectiveInvoiceSubtype(document)
  return effectiveSubtype === 'avoir' ? `invoice:avoir:${document.id}` : `invoice:${effectiveSubtype}`
}

export const annotateDocumentLifecycle = <
  T extends { id: number, type: BillingDocumentType, subtype?: string | null, createdAt?: string | Date | null }
>(documents: T[]): LifecycleAnnotatedDocument<T>[] => {
  const groups = new Map<string, T[]>()

  documents.forEach((document) => {
    const key = getLifecycleGroupKey(document)
    groups.set(key, [...(groups.get(key) ?? []), document])
  })

  const lifecycleByDocumentId = new Map<number, { lifecycle: DocumentLifecycle, supersededByDocumentId: number | null }>()

  groups.forEach((group) => {
    const [current, ...superseded] = [...group].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime || b.id - a.id
    })

    if (!current) return

    lifecycleByDocumentId.set(current.id, { lifecycle: 'current', supersededByDocumentId: null })
    superseded.forEach((document) => {
      lifecycleByDocumentId.set(document.id, { lifecycle: 'superseded', supersededByDocumentId: current.id })
    })
  })

  return documents.map(document => ({
    ...document,
    ...(lifecycleByDocumentId.get(document.id) ?? { lifecycle: 'current' as const, supersededByDocumentId: null })
  }))
}

// --- Billing workflow cascade -------------------------------------------------------------
//
// Derives, for a project, the effective status of each of the 4 billing steps (Proposition
// commerciale → Devis → Facture d'acompte → Facture), per the Figma state-machine spec:
// - a real document's own status always wins;
// - a step with no document yet inherits "draft" (not reached) unless the previous step just
//   got "completed" (which activates it) or ended negatively (refused/cancelled/non_applicable),
//   which cascades "non_applicable" onto it;
// - a "non_applicable" Devis (real or cascaded) skips the Facture d'acompte step entirely, even
//   when `requiresAcompte` is true - Facture then follows directly from the Devis.
// This is purely a read-time derivation: cascaded statuses are never written back to a document row.

export type BillingStepKey = 'proposal' | 'quote' | 'acompte' | 'invoice'

export type BillingStep = {
  key: BillingStepKey
  documentType: BillingDocumentType
  subtype: InvoiceSubtype | null
  status: DocumentStatus
  documentId: number | null
}

export type BillingDocumentLike = {
  id: number
  type: BillingDocumentType
  subtype?: string | null
  status: DocumentStatus
  lifecycle: DocumentLifecycle
}

const deriveStepStatus = (previousEffectiveStatus: DocumentStatus | null, ownStatus: DocumentStatus | undefined): DocumentStatus => {
  if (ownStatus) return ownStatus
  if (previousEffectiveStatus === 'completed') return 'draft'
  if (previousEffectiveStatus === 'refused' || previousEffectiveStatus === 'cancelled' || previousEffectiveStatus === 'non_applicable') {
    return 'non_applicable'
  }
  return 'draft'
}

export const computeProjectBillingSteps = <T extends BillingDocumentLike>(
  documents: T[],
  requiresAcompte: boolean
): BillingStep[] => {
  const current = documents.filter(document => document.lifecycle === 'current')
  const findCurrent = (predicate: (document: T) => boolean) => current.find(predicate) ?? null

  const proposalDocument = findCurrent(document => document.type === 'commercial_proposal')
  const quoteDocument = findCurrent(document => document.type === 'quote')
  const acompteDocument = findCurrent(document => getEffectiveInvoiceSubtype(document) === 'acompte')
  const invoiceDocument = findCurrent((document) => {
    const effectiveSubtype = getEffectiveInvoiceSubtype(document)
    return effectiveSubtype === 'unique' || effectiveSubtype === 'solde'
  })

  const proposalStatus = deriveStepStatus(null, proposalDocument?.status)
  const quoteStatus = deriveStepStatus(proposalStatus, quoteDocument?.status)

  const quoteSkipsAcompte = quoteStatus === 'non_applicable'
  const acompteApplies = requiresAcompte && !quoteSkipsAcompte

  const acompteStatus = acompteApplies
    ? deriveStepStatus(quoteStatus, acompteDocument?.status)
    : (acompteDocument?.status ?? 'non_applicable')

  // A deliberately skipped Devis ("non_applicable") clears the way forward like a completed step would -
  // only a genuinely negative outcome (refused/cancelled) should cascade "non_applicable" onward. Same
  // rule for a deliberately skipped acompte: its *own* status being "non_applicable" (not a cascade from
  // a refused/cancelled quote) activates Facture, per the Figma "Facture d'acompte" state table.
  const acompteSkipsToInvoice = acompteDocument?.status === 'non_applicable'
  const invoicePreviousStatus = acompteApplies
    ? (acompteSkipsToInvoice ? 'completed' : acompteStatus)
    : (quoteSkipsAcompte ? 'completed' : quoteStatus)
  const invoiceStatus = deriveStepStatus(invoicePreviousStatus, invoiceDocument?.status)

  return [
    { key: 'proposal', documentType: 'commercial_proposal', subtype: null, status: proposalStatus, documentId: proposalDocument?.id ?? null },
    { key: 'quote', documentType: 'quote', subtype: null, status: quoteStatus, documentId: quoteDocument?.id ?? null },
    { key: 'acompte', documentType: 'invoice', subtype: 'acompte', status: acompteStatus, documentId: acompteDocument?.id ?? null },
    {
      key: 'invoice',
      documentType: 'invoice',
      subtype: invoiceDocument ? getEffectiveInvoiceSubtype(invoiceDocument) : 'unique',
      status: invoiceStatus,
      documentId: invoiceDocument?.id ?? null
    }
  ]
}

export type BillingActionCta = {
  label: string
  tone: 'neutral' | 'warning' | 'success' | 'muted'
}

const billingStepToIssueLabel: Record<BillingStepKey, string> = {
  proposal: 'Proposition',
  quote: 'Devis',
  acompte: 'Facture d\'acompte',
  invoice: 'Facture'
}

const billingStepToSentLabel: Record<BillingStepKey, string> = {
  proposal: 'En attente de validation',
  quote: 'En attente de signature',
  acompte: 'En attente de règlement',
  invoice: 'En attente de règlement'
}

// A "Sans suite" project is one where a step's *own* (not cascaded) status is refused/cancelled -
// distinguishing that from a downstream step that merely inherited "non_applicable" by cascade.
export const getBillingActionCta = (steps: BillingStep[]): BillingActionCta => {
  const hasRealTerminalFailure = steps.some(step =>
    step.documentId !== null && (step.status === 'refused' || step.status === 'cancelled'))

  if (hasRealTerminalFailure) return { label: 'Sans suite', tone: 'muted' }

  const blockingStep = steps.find(step => step.status === 'draft' || step.status === 'sent')

  if (!blockingStep) return { label: 'Clôturer facturé et payé', tone: 'success' }

  return blockingStep.status === 'draft'
    ? { label: `${billingStepToIssueLabel[blockingStep.key]} à émettre`, tone: 'neutral' }
    : { label: billingStepToSentLabel[blockingStep.key], tone: 'warning' }
}
