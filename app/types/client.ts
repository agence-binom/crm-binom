import type { ProspectionStatus } from '../constants/prospection'

export type Client = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  postalCode?: string | null
  country?: string | null
  website?: string | null
  siret?: string | null
  notes?: string | null
  icon?: string | null
  archived?: boolean | null
  description?: string | null
  prospectionStatus?: ProspectionStatus | null
  contactedAt?: string | null
  relancedAt?: string | null
}
