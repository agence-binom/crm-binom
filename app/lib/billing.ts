import {
  annotateDocumentLifecycle,
  computeProjectBillingSteps,
  getBillingStatus,
  type BillingStatus,
  type BillingDocumentType,
  type BillingStep,
  type DocumentLifecycle,
  type DocumentStatus
} from './documents'

export type BillingProjectDocument = {
  id: number
  projectId: number
  type: BillingDocumentType
  status: DocumentStatus
  subtype?: string | null
  hasLink: boolean
  hasFile: boolean
  externalUrl?: string | null
  createdAt?: string | Date | null
  statusDate?: string | Date | null
  description?: string | null
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
  documents?: BillingProjectDocument[]
}

export type BillingProjectStatus = {
  project: BillingProjectBase
  documents: BillingProjectDocumentWithLifecycle[]
  billingSteps: BillingStep[]
  billingStatus: BillingStatus
}

export const buildBillingProjectStatus = ({
  project,
  documents
}: BillingProjectStatusInput): BillingProjectStatus => {
  const annotatedDocuments = annotateDocumentLifecycle(documents ?? [])
  const billingSteps = computeProjectBillingSteps(annotatedDocuments, project.requiresAcompte)

  return {
    project,
    documents: annotatedDocuments,
    billingSteps,
    billingStatus: getBillingStatus(billingSteps)
  }
}
