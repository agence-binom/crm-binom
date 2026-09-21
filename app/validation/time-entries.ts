import { z } from 'zod'

const userIdSchema = z.number().int('L\'ID utilisateur doit être un entier').positive('L\'ID utilisateur doit être positif')

export const timeEntryCreateSchema = z.object({
  taskId: z.number().int('L\'ID tâche doit être un entier').positive('L\'ID tâche doit être positif').optional(),
  userId: userIdSchema,
  notes: z.string().optional().or(z.literal('')),
  duration: z.number().int('La durée doit être un entier').positive('La durée doit être positive')
})

export const timeEntryUpdateSchema = z.object({
  taskId: z.number().int('L\'ID tâche doit être un entier').positive('L\'ID tâche doit être positif').optional(),
  userId: userIdSchema.optional(),
  notes: z.string().optional().or(z.literal('')),
  duration: z.number().int('La durée doit être un entier').positive('La durée doit être positive').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni'
})

export const timeEntryIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export const timeEntryListQuerySchema = z.object({
  taskId: z.coerce.number().int('L\'ID tâche doit être un entier').positive('L\'ID tâche doit être positif')
})

export type TimeEntryCreate = z.infer<typeof timeEntryCreateSchema>
export type TimeEntryUpdate = z.infer<typeof timeEntryUpdateSchema>
export type TimeEntryId = z.infer<typeof timeEntryIdSchema>
