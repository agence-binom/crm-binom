import type { TaskAttachmentType } from '../constants/task-attachments'

export function getTaskAttachmentTypeLabel(type: TaskAttachmentType) {
  switch (type) {
    case 'link':
      return 'Lien'
    default:
      return 'Document'
  }
}

export function getTaskAttachmentTypeIcon(type: TaskAttachmentType) {
  switch (type) {
    case 'link':
      return 'i-lucide-link'
    default:
      return 'i-lucide-file'
  }
}

export function getTaskAttachmentTypeColor(type: TaskAttachmentType): 'primary' | 'info' {
  switch (type) {
    case 'link':
      return 'info'
    default:
      return 'primary'
  }
}
