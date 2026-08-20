import { invoiceSubtypes, type documentStatuses } from '../validation/documents'

export type DocumentStatus = typeof documentStatuses[number]
export type BillingDocumentType = 'quote' | 'invoice' | 'commercial_proposal'
export type InvoiceSubtype = typeof invoiceSubtypes[number]

export const documentStatusLabels: Record<BillingDocumentType, Record<DocumentStatus, string>> = {
  commercial_proposal: {
    draft: 'Brouillon',
    sent: 'Envoyée',
    completed: 'Validée',
    cancelled: 'Rejetée'
  },
  quote: {
    draft: 'Brouillon',
    sent: 'Envoyé',
    completed: 'Signé',
    cancelled: 'Rejeté'
  },
  invoice: {
    draft: 'Brouillon',
    sent: 'Envoyée',
    completed: 'Payée',
    cancelled: 'Annulée'
  }
}

// Cancelled/rejected ranks below draft so it never overshadows a genuinely advancing sibling document
// (e.g. a rejected "acompte" shouldn't hide that the "solde" is progressing) when computing a group's stage.
const documentStatusRank: Record<DocumentStatus, number> = {
  cancelled: -1,
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
