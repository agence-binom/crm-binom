export type ContactClientSummary = {
  id: number
  name: string
}

export type Contact = {
  id: number
  clientId: number | null
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  position?: string | null
  mobile?: string | null
  notes?: string | null
  archived?: boolean | null
  client?: ContactClientSummary | null
}
