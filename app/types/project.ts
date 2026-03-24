export type Project = {
  id: number
  clientId: number
  name: string
  description?: string | null
  status?: string | null
  url?: string | null
  notes?: string | null
  startDate?: string | null
  endDate?: string | null
  links?: string[] | null
}
