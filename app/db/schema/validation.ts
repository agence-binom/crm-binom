import * as z from 'zod'

// ========== USERS ==========
export const userCreateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  email: z.string().email('Email invalide').max(255, 'Email trop long'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').max(255, 'Le mot de passe est trop long'),
  role: z.enum(['admin', 'employee', 'client'], {
    message: 'Le rôle doit être "admin", "employee" ou "client"'
  }).default('client')
})

export const userUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional(),
  email: z.string().email('Email invalide').max(255, 'Email trop long').optional(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').max(255, 'Le mot de passe est trop long').optional(),
  role: z.enum(['admin', 'employee', 'client'], {
    message: 'Le rôle doit être "admin", "employee" ou "client"'
  }).optional()
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
  email: z.string().email('Email invalide').max(255, 'Email trop long').optional().or(z.literal('')),
  phone: z.string().max(50, 'Téléphone trop long').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().max(100, 'Ville trop longue').optional().or(z.literal('')),
  postalCode: z.string().regex(/^\d*$/, 'Le code postal doit contenir uniquement des chiffres').max(5, 'Code postal trop long').optional().or(z.literal('')),
  country: z.string().max(100, 'Pays trop long').optional().or(z.literal('')),
  website: z.string().url('URL invalide').max(255, 'URL trop longue').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
})

export const clientUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional().or(z.literal('')),
  email: z.string().email('Email invalide').max(255, 'Email trop long').optional().or(z.literal('')),
  phone: z.string().max(50, 'Téléphone trop long').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().max(100, 'Ville trop longue').optional().or(z.literal('')),
  postalCode: z.string().regex(/^\d*$/, 'Le code postal doit contenir uniquement des chiffres').max(5, 'Code postal trop long').optional().or(z.literal('')),
  country: z.string().max(100, 'Pays trop long').optional().or(z.literal('')),
  website: z.string().url('URL invalide').max(255, 'URL trop longue').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
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
  userId: z.number().int('L\'ID utilisateur doit être un entier').positive('L\'ID utilisateur doit être positif').optional(),
  firstName: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom est trop long'),
  lastName: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  email: z.string().email('Email invalide').max(255, 'Email trop long').optional().or(z.literal('')),
  phone: z.string().max(50, 'Téléphone trop long').optional().or(z.literal('')),
  position: z.string().max(100, 'Poste trop long').optional().or(z.literal('')),
  mobile: z.string().max(50, 'Mobile trop long').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
})

export const contactUpdateSchema = z.object({
  clientId: z.number().int('L\'ID client doit être un entier').positive('L\'ID client doit être positif').optional(),
  userId: z.number().int('L\'ID utilisateur doit être un entier').positive('L\'ID utilisateur doit être positif').optional().nullable(),
  firstName: z.string().min(1, 'Le prénom ne peut pas être vide').max(100, 'Le prénom est trop long').optional().or(z.literal('')),
  lastName: z.string().min(1, 'Le nom ne peut pas être vide').max(100, 'Le nom est trop long').optional().or(z.literal('')),
  email: z.string().email('Email invalide').max(255, 'Email trop long').optional().or(z.literal('')),
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

// ========== PROJECTS ==========
export const projectCreateSchema = z.object({
  clientId: z.number().int('L\'ID client doit être un entier').positive('L\'ID client doit être positif'),
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['en_cours', 'termine', 'en_attente', 'annule'], {
    message: 'Le statut doit être "en_cours", "termine", "en_attente" ou "annule"'
  }).default('en_cours'),
  budget: z.number().int('Le budget doit être un entier').positive('Le budget doit être positif').optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  url: z.string().url('URL invalide').max(255, 'URL trop longue').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
})

export const projectUpdateSchema = z.object({
  clientId: z.number().int('L\'ID client doit être un entier').positive('L\'ID client doit être positif').optional(),
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['en_cours', 'termine', 'en_attente', 'annule'], {
    message: 'Le statut doit être "en_cours", "termine", "en_attente" ou "annule"'
  }).optional(),
  budget: z.number().int('Le budget doit être un entier').positive('Le budget doit être positif').optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  url: z.string().url('URL invalide').max(255, 'URL trop longue').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
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
