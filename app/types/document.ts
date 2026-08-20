export type ProjectDocument = {
  id: number
  name: string
  filename: string
  filepath: string
  externalUrl?: string | null
  downloadUrl?: string | null
  mimetype: string
  size: number
  entityType: string
  entityId: number
  documentType?: string | null
  status: 'draft' | 'sent' | 'completed' | 'cancelled'
  subtype?: string | null
  description?: string | null
  createdAt: string | Date
}
