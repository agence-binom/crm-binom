export type ClientIconOption = {
  label: string
  value: string
}

export const clientIconOptions: ClientIconOption[] = [
  { label: 'Entreprise', value: 'i-lucide-briefcase' },
  { label: 'Bâtiment', value: 'i-lucide-building-2' },
  { label: 'Boutique', value: 'i-lucide-store' },
  { label: 'Marketing', value: 'i-lucide-megaphone' },
  { label: 'Artisanat', value: 'i-lucide-wrench' },
  { label: 'Juridique', value: 'i-lucide-scale' },
  { label: 'Santé', value: 'i-lucide-heart-pulse' },
  { label: 'Éducation', value: 'i-lucide-graduation-cap' },
  { label: 'Créatif', value: 'i-lucide-palette' },
  { label: 'Logistique', value: 'i-lucide-truck' },
  { label: 'Tech', value: 'i-lucide-monitor-smartphone' }
]

export const clientIconValues = clientIconOptions
  .map(option => option.value)
  .filter(Boolean)
