import { clientIconOptions } from './client-icons'

export type ClientStatus = 'active' | 'inactive' | 'archived'

export const defaultClientIcon = clientIconOptions[0]?.value ?? 'i-lucide-briefcase'

export const clientStatusOptions: Array<{ label: string, value: ClientStatus }> = [
  { label: 'Actif', value: 'active' },
  { label: 'Inactif', value: 'inactive' },
  { label: 'Archivé', value: 'archived' }
]

export function normalizeClientStatus(status?: string | null): ClientStatus {
  if (status === 'inactive' || status === 'archived') {
    return status
  }

  return 'active'
}

export function getClientIcon(icon?: string | null) {
  return icon || defaultClientIcon
}
