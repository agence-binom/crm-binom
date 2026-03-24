import { z } from 'zod'

export const projectCreateSchema = z.object({
  clientId: z.number().int('L\'ID client doit être un entier').positive('L\'ID client doit être positif'),
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['en_cours', 'termine', 'en_attente', 'annule'], {
    message: 'Le statut doit être "en_cours", "termine", "en_attente" ou "annule"'
  }).default('en_cours'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  url: z.url('URL invalide').max(255, 'URL trop longue').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  links: z.array(z.string().url('URL invalide')).optional()
})

export const projectUpdateSchema = z.object({
  clientId: z.number().int('L\'ID client doit être un entier').positive('L\'ID client doit être positif').optional(),
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['en_cours', 'termine', 'en_attente', 'annule'], {
    message: 'Le statut doit être "en_cours", "termine", "en_attente" ou "annule"'
  }).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  url: z.url('URL invalide').max(255, 'URL trop longue').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  links: z.array(z.url('URL invalide')).optional()
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' }
)

export const projectIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export type ProjectCreate = z.infer<typeof projectCreateSchema>
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>
export type ProjectId = z.infer<typeof projectIdSchema>

// Type léger pour usage client
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
