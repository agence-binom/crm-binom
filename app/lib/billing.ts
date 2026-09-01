import {
  annotateDocumentLifecycle,
  computeProjectBillingSteps,
  getBillingActionCta,
  getMostAdvancedDocumentStatus,
  type BillingActionCta,
  type BillingDocumentType,
  type BillingStep,
  type DocumentLifecycle,
  type DocumentStatus
} from './documents'

export type BillingCoverageStatus = 'none' | 'partial' | 'complete'

export type BillingCoverage = {
  total: number
  withLinkCount: number
  missingLinkCount: number
  status: BillingCoverageStatus
  stage: DocumentStatus | 'none'
}

export type BillingProjectDocument = {
  id: number
  projectId: number
  type: BillingDocumentType
  status: DocumentStatus
  subtype?: string | null
  hasLink: boolean
  externalUrl?: string | null
  createdAt?: string | Date | null
}

export type BillingProjectDocumentWithLifecycle = BillingProjectDocument & {
  lifecycle: DocumentLifecycle
  supersededByDocumentId: number | null
}

type BillingProjectBase = {
  id: number
  clientId: number
  name: string
  status?: string | null
  startDate?: string | Date | null
  endDate?: string | Date | null
  requiresAcompte: boolean
  client: {
    id: number
    name: string
  }
}

type BillingProjectStatusInput = {
  project: BillingProjectBase
  quoteTotal: number
  invoiceTotal: number
  proposalTotal: number
  documents?: BillingProjectDocument[]
}

export type BillingProjectStatus = {
  project: BillingProjectBase
  quoteCoverage: BillingCoverage
  invoiceCoverage: BillingCoverage
  proposalCoverage: BillingCoverage
  documents: BillingProjectDocumentWithLifecycle[]
  totalDocuments: number
  missingLinkCount: number
  isComplete: boolean
  billingSteps: BillingStep[]
  actionCta: BillingActionCta
}

// `total` reflects every document of that type, superseded ones included (used for the "N documents" count
// badge). `status`/`missingLinkCount`/`stage` reflect only the *current* documents, since a superseded quote
// missing its Facture.net link shouldn't make the project look incomplete.
export const getBillingCoverage = (
  total: number,
  documents: BillingProjectDocumentWithLifecycle[],
  { excludeSubtype, requireLink = true }: { excludeSubtype?: string, requireLink?: boolean } = {}
): BillingCoverage => {
  const currentDocuments = documents.filter(document =>
    document.lifecycle === 'current' && (!excludeSubtype || document.subtype !== excludeSubtype))

  const currentTotal = currentDocuments.length
  const currentWithLinkCount = requireLink
    ? currentDocuments.filter(document => document.hasLink).length
    : currentTotal
  const missingLinkCount = currentTotal - currentWithLinkCount

  let status: BillingCoverageStatus = 'none'
  if (currentTotal > 0) {
    status = missingLinkCount > 0 ? 'partial' : 'complete'
  }

  return {
    total: Math.max(0, total),
    withLinkCount: currentWithLinkCount,
    missingLinkCount,
    status,
    stage: getMostAdvancedDocumentStatus(currentDocuments.map(document => document.status)) ?? 'none'
  }
}

export const buildBillingProjectStatus = ({
  project,
  quoteTotal,
  invoiceTotal,
  proposalTotal,
  documents
}: BillingProjectStatusInput): BillingProjectStatus => {
  const annotatedDocuments = annotateDocumentLifecycle(documents ?? [])

  const quoteDocuments = annotatedDocuments.filter(document => document.type === 'quote')
  const invoiceDocuments = annotatedDocuments.filter(document => document.type === 'invoice')
  const proposalDocuments = annotatedDocuments.filter(document => document.type === 'commercial_proposal')

  const quoteCoverage = getBillingCoverage(quoteTotal, quoteDocuments)
  // A lone "avoir" (credit note) doesn't count as a real invoice for completeness purposes.
  const invoiceCoverage = getBillingCoverage(invoiceTotal, invoiceDocuments, { excludeSubtype: 'avoir' })
  // Commercial proposals don't require a Facture.net link, so "covered" just means "uploaded".
  const proposalCoverage = getBillingCoverage(proposalTotal, proposalDocuments, { requireLink: false })
  const missingLinkCount = quoteCoverage.missingLinkCount + invoiceCoverage.missingLinkCount

  const billingSteps = computeProjectBillingSteps(annotatedDocuments, project.requiresAcompte)

  return {
    project,
    quoteCoverage,
    invoiceCoverage,
    proposalCoverage,
    documents: annotatedDocuments,
    totalDocuments: quoteCoverage.total + invoiceCoverage.total + proposalCoverage.total,
    missingLinkCount,
    isComplete: quoteCoverage.status === 'complete' && invoiceCoverage.status === 'complete' && proposalCoverage.status === 'complete',
    billingSteps,
    actionCta: getBillingActionCta(billingSteps)
  }
}
