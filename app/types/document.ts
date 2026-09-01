// A generic file attachment (documents table) — always a real uploaded file.
export type ProjectDocument = {
  id: number
  name: string
  filename: string
  filepath: string
  downloadUrl?: string | null
  mimetype: string
  size: number
  entityType: string
  entityId: number
  description?: string | null
  createdAt: string | Date
}

// A billing_documents row, with the attached file's metadata flattened in when one exists.
export type BillingDocumentRecord = {
  id: number
  projectId: number
  documentType: 'commercial_proposal' | 'quote' | 'invoice'
  subtype?: string | null
  status: 'draft' | 'sent' | 'completed' | 'cancelled' | 'refused' | 'non_applicable'
  statusDate?: string | Date | null
  externalUrl?: string | null
  description?: string | null
  documentId: number | null
  filename?: string | null
  filepath?: string | null
  downloadUrl?: string | null
  mimetype?: string | null
  size?: number | null
  createdAt: string | Date
  updatedAt?: string | Date
}
