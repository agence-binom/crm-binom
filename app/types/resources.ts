import type { ResourceType } from '~/constants/resources'

export type ProjectResource = {
  id: number
  projectId: number
  type: ResourceType
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
