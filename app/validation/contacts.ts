import { z } from 'zod'

export const contactCreateSchema = z.object({
  clientId: z.number().int('L\'ID client doit être un entier').positive('L\'ID client doit être positif'),
  firstName: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom est trop long'),
  lastName: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  email: z.email('Email invalide').max(255, 'Email trop long').optional().or(z.literal('')),
  phone: z.string().max(50, 'Téléphone trop long').optional().or(z.literal('')),
  position: z.string().max(100, 'Poste trop long').optional().or(z.literal('')),
  mobile: z.string().max(50, 'Mobile trop long').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
})

export const contactUpdateSchema = z.object({
  clientId: z.number().int('L\'ID client doit être un entier').positive('L\'ID client doit être positif').optional(),
  firstName: z.string().min(1, 'Le prénom ne peut pas être vide').max(100, 'Le prénom est trop long').optional().or(z.literal('')),
  lastName: z.string().min(1, 'Le nom ne peut pas être vide').max(100, 'Le nom est trop long').optional().or(z.literal('')),
  email: z.email('Email invalide').max(255, 'Email trop long').optional().or(z.literal('')),
  phone: z.string().max(50, 'Téléphone trop long').optional().or(z.literal('')),
  position: z.string().max(100, 'Poste trop long').optional().or(z.literal('')),
  mobile: z.string().max(50, 'Mobile trop long').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' }
)

export const contactIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export type ContactCreate = z.infer<typeof contactCreateSchema>
export type ContactUpdate = z.infer<typeof contactUpdateSchema>
export type ContactId = z.infer<typeof contactIdSchema>
