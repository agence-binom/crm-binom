import { z } from 'zod'

const taskIdSchema = z.number().int('L\'ID tâche doit être un entier').positive('L\'ID tâche doit être positif')
const projectIdSchema = z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif')
const userIdSchema = z.number().int('L\'ID utilisateur doit être un entier').positive('L\'ID utilisateur doit être positif')

export const timeEntryCreateSchema = z.object({
  taskId: taskIdSchema.nullable().optional(),
  projectId: projectIdSchema.nullable().optional(),
  userId: userIdSchema,
  notes: z.string().optional().or(z.literal('')),
  duration: z.number().int('La durée doit être un entier').positive('La durée doit être positive')
}).refine(data => data.taskId != null || data.projectId != null, {
  message: 'Le temps doit être rattaché à une tâche ou à un projet',
  path: ['taskId']
})

export const timeEntryUpdateSchema = z.object({
  taskId: taskIdSchema.nullable().optional(),
  projectId: projectIdSchema.nullable().optional(),
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
