import type { ResourceType } from '../constants/resources'

export function getResourceTypeLabel(type: ResourceType) {
  switch (type) {
    case 'link':
      return 'Lien'
    case 'text':
      return 'Texte'
    default:
      return 'Document'
  }
}

export function getResourceTypeIcon(type: ResourceType) {
  switch (type) {
    case 'link':
      return 'i-lucide-link'
    case 'text':
      return 'i-lucide-notebook-text'
    default:
      return 'i-lucide-file'
  }
}

export function getResourceTypeColor(type: ResourceType): 'primary' | 'info' | 'warning' {
  switch (type) {
    case 'link':
      return 'info'
    case 'text':
      return 'warning'
    default:
      return 'primary'
  }
}
