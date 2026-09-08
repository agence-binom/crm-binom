import type { DeliverableType } from '~/constants/deliverables'

export type ProjectDeliverable = {
  id: number
  projectId?: number | null
  type: DeliverableType
  name: string
  description?: string | null
  filename?: string | null
  filepath?: string | null
  downloadUrl?: string | null
  mimetype?: string | null
  size?: number | null
  url?: string | null
  content?: string | null
  createdAt: string | Date
  updatedAt: string | Date
}
