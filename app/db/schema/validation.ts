import * as z from 'zod'

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
