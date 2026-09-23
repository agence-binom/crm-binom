import { clientIconOptions } from './client-icons'
import { formatPhone, getPhoneHref } from './phone'

export const defaultClientIcon = clientIconOptions[0]?.value ?? 'i-lucide-briefcase'

export function getClientIcon(icon?: string | null) {
  return icon || defaultClientIcon
}

type ClientContact = {
  email?: string | null
  phone?: string | null
  website?: string | null
}

export function getClientContactInfos(client?: ClientContact | null) {
  return [
    { value: client?.email, icon: 'i-lucide-mail', href: client?.email ? `mailto:${client.email}` : undefined, label: 'Envoyer un e-mail' },
    {
      value: client?.phone ? formatPhone(client.phone) : null,
      icon: 'i-lucide-phone',
      href: client?.phone ? getPhoneHref(client.phone) : undefined,
      label: 'Appeler'
    },
    { value: client?.website, icon: 'i-lucide-globe' }
  ]
}
