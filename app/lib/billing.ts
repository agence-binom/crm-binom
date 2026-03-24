export type BillingCoverageStatus = 'none' | 'partial' | 'complete'

export type BillingCoverage = {
  total: number
  withLinkCount: number
  missingLinkCount: number
  status: BillingCoverageStatus
}

type BillingProjectBase = {
  id: number
  clientId: number
  name: string
  status?: string | null
  startDate?: string | Date | null
  endDate?: string | Date | null
  client: {
    id: number
    name: string
  }
}

type BillingProjectStatusInput = {
  project: BillingProjectBase
  quoteTotal: number
  quoteWithLinkCount: number
  invoiceTotal: number
  invoiceWithLinkCount: number
}

export type BillingProjectStatus = {
  project: BillingProjectBase
  quoteCoverage: BillingCoverage
  invoiceCoverage: BillingCoverage
  totalDocuments: number
  missingLinkCount: number
  isComplete: boolean
}

export const getBillingCoverage = (
  total: number,
  withLinkCount: number
): BillingCoverage => {
  const safeTotal = Math.max(0, total)
  const safeWithLinkCount = Math.max(0, Math.min(withLinkCount, safeTotal))
  const missingLinkCount = safeTotal - safeWithLinkCount

  let status: BillingCoverageStatus = 'none'

  if (safeTotal > 0) {
    status = missingLinkCount > 0 ? 'partial' : 'complete'
  }

  return {
    total: safeTotal,
    withLinkCount: safeWithLinkCount,
    missingLinkCount,
    status
  }
}

export const buildBillingProjectStatus = ({
  project,
  quoteTotal,
  quoteWithLinkCount,
  invoiceTotal,
  invoiceWithLinkCount
}: BillingProjectStatusInput): BillingProjectStatus => {
  const quoteCoverage = getBillingCoverage(quoteTotal, quoteWithLinkCount)
  const invoiceCoverage = getBillingCoverage(invoiceTotal, invoiceWithLinkCount)
  const missingLinkCount = quoteCoverage.missingLinkCount + invoiceCoverage.missingLinkCount

  return {
    project,
    quoteCoverage,
    invoiceCoverage,
    totalDocuments: quoteCoverage.total + invoiceCoverage.total,
    missingLinkCount,
    isComplete: quoteCoverage.status === 'complete' && invoiceCoverage.status === 'complete'
  }
}
