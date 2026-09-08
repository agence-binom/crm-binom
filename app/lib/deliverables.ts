import type { DeliverableType } from '../constants/deliverables'

export function getDeliverableTypeLabel(type: DeliverableType) {
  switch (type) {
    case 'link':
      return 'Lien'
    case 'text':
      return 'Texte'
    default:
      return 'Document'
  }
}

export function getDeliverableTypeIcon(type: DeliverableType) {
  switch (type) {
    case 'link':
      return 'i-lucide-link'
    case 'text':
      return 'i-lucide-notebook-text'
    default:
      return 'i-lucide-package'
  }
}
