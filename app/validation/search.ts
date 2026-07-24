import { z } from 'zod'

export const globalSearchQuerySchema = z.object({
  q: z.string().trim().min(2, 'La recherche doit contenir au moins 2 caractères').max(255, 'La recherche est trop longue')
})

export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>
