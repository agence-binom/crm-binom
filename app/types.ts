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
  documentType?: string | null
  description?: string | null
  createdAt: string | Date
}
