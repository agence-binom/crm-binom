import type { TaskAttachmentType } from '~/constants/task-attachments'

export type TaskAttachment = {
  id: number
  taskId: number
  type: TaskAttachmentType
  name: string
  description?: string | null
  filename?: string | null
  filepath?: string | null
  downloadUrl?: string | null
  mimetype?: string | null
  size?: number | null
  url?: string | null
  createdAt: string | Date
  updatedAt: string | Date
}
