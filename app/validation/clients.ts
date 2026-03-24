import { z } from 'zod'
import { clientIconValues } from '../lib/client-icons'

const clientIconSchema = z.string()
  .regex(
    /^i-[a-z0-9-]+(?:-[a-z0-9-]+)+$/,
    'Choisissez une icône valide dans la liste'
  )
  .max(100, 'Icône trop longue')
  .refine(
    value => clientIconValues.some(icon => icon === value) || value.startsWith('i-'),
    'Choisissez une icône proposée ou conservez une icône Iconify existante'
  )
  .optional()
  .or(z.literal(''))

export const clientCreateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  email: z.email('Email invalide').max(255, 'Email trop long').optional().or(z.literal('')),
  phone: z.string().max(50, 'Téléphone trop long').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().max(100, 'Ville trop longue').optional().or(z.literal('')),
  postalCode: z.string().regex(/^\d*$/, 'Le code postal doit contenir uniquement des chiffres').max(5, 'Code postal trop long').optional().or(z.literal('')),
  country: z.string().max(100, 'Pays trop long').optional().or(z.literal('')),
  website: z.url('URL invalide').max(255, 'URL trop longue').optional().or(z.literal('')),
  siret: z.string().regex(/^\d{14}$/, 'Le SIRET doit contenir 14 chiffres').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  icon: clientIconSchema,
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  description: z.string().optional().or(z.literal(''))
})

export const clientUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional().or(z.literal('')),
  email: z.email('Email invalide').max(255, 'Email trop long').optional().or(z.literal('')),
  phone: z.string().max(50, 'Téléphone trop long').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().max(100, 'Ville trop longue').optional().or(z.literal('')),
  postalCode: z.string().regex(/^\d*$/, 'Le code postal doit contenir uniquement des chiffres').max(5, 'Code postal trop long').optional().or(z.literal('')),
  country: z.string().max(100, 'Pays trop long').optional().or(z.literal('')),
  website: z.url('URL invalide').max(255, 'URL trop longue').optional().or(z.literal('')),
  siret: z.string().regex(/^\d{14}$/, 'Le SIRET doit contenir 14 chiffres').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  icon: clientIconSchema,
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  description: z.string().optional().or(z.literal(''))
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' }
)

export const clientIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export type ClientCreate = z.infer<typeof clientCreateSchema>
export type ClientUpdate = z.infer<typeof clientUpdateSchema>
export type ClientId = z.infer<typeof clientIdSchema>

// Type léger pour usage client
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
  status?: string | null
  description?: string | null
}
