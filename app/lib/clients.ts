import { clientIconOptions } from './client-icons'

export const defaultClientIcon = clientIconOptions[0]?.value ?? 'i-lucide-briefcase'

export function getClientIcon(icon?: string | null) {
  return icon || defaultClientIcon
}
