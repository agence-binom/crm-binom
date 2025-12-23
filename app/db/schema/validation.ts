import * as z from 'zod'

// ========== USERS ==========
export const userCreateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  email: z.string().email('Email invalide').max(255, 'Email trop long'),
  age: z.number().int('L\'âge doit être un entier').positive('L\'âge doit être positif')
})

export const userUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional(),
  email: z.string().email('Email invalide').max(255, 'Email trop long').optional(),
  age: z.number().int('L\'âge doit être un entier').positive('L\'âge doit être positif').optional()
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' }
)

export const userQuerySchema = z.object({
  email: z.string().email('Email invalide').optional()
})

export const userIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export type UserCreate = z.infer<typeof userCreateSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
export type UserQuery = z.infer<typeof userQuerySchema>
export type UserId = z.infer<typeof userIdSchema>

// ========== CLIENTS ==========
export const clientCreateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  email: z.string().email('Email invalide').max(255, 'Email trop long').optional(),
  phone: z.string().max(50, 'Téléphone trop long').optional(),
  address: z.string().optional(),
  city: z.string().max(100, 'Ville trop longue').optional(),
  postalCode: z.number().int('Le code postal doit être un entier').positive('Le code postal doit être positif').max(5, 'Code postal trop long').optional(),
  country: z.string().max(100, 'Pays trop long').optional(),
  website: z.string().url('URL invalide').max(255, 'URL trop longue').optional(),
  notes: z.string().optional()
})

export const clientUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional(),
  email: z.string().email('Email invalide').max(255, 'Email trop long').optional(),
  phone: z.string().max(50, 'Téléphone trop long').optional(),
  address: z.string().optional(),
  city: z.string().max(100, 'Ville trop longue').optional(),
  postalCode: z.number().int('Le code postal doit être un entier').positive('Le code postal doit être positif').max(5, 'Code postal trop long').optional(),
  country: z.string().max(100, 'Pays trop long').optional(),
  website: z.string().url('URL invalide').max(255, 'URL trop longue').optional(),
  notes: z.string().optional()
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

// ========== CONTACTS ==========
export const contactCreateSchema = z.object({
  clientId: z.number().int('L\'ID client doit être un entier').positive('L\'ID client doit être positif'),
  firstName: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom est trop long'),
  lastName: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  email: z.string().email('Email invalide').max(255, 'Email trop long').optional(),
  phone: z.string().max(50, 'Téléphone trop long').optional(),
  position: z.string().max(100, 'Poste trop long').optional(),
  mobile: z.string().max(50, 'Mobile trop long').optional(),
  notes: z.string().optional()
})

export const contactUpdateSchema = z.object({
  clientId: z.number().int('L\'ID client doit être un entier').positive('L\'ID client doit être positif').optional(),
  firstName: z.string().min(1, 'Le prénom ne peut pas être vide').max(100, 'Le prénom est trop long').optional(),
  lastName: z.string().min(1, 'Le nom ne peut pas être vide').max(100, 'Le nom est trop long').optional(),
  email: z.string().email('Email invalide').max(255, 'Email trop long').optional(),
  phone: z.string().max(50, 'Téléphone trop long').optional(),
  position: z.string().max(100, 'Poste trop long').optional(),
  mobile: z.string().max(50, 'Mobile trop long').optional(),
  notes: z.string().optional()
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
