import { z } from 'zod'
import {
  taskPriorities,
  taskStatuses,
  taskWorkspaces
} from '~/constants/tasks'

const taskStatusSchema = z.enum(taskStatuses)
const taskWorkspaceSchema = z.enum(taskWorkspaces)
const optionalDateSchema = z.preprocess(
  value => (value === '' || value == null ? undefined : value),
  z.coerce.date().optional()
)
// null est préservé (contrairement à optionalDateSchema) pour distinguer
// "champ non fourni" (undefined, ignoré par le update SQL) de "date à effacer" (null).
const nullableDateSchema = z.preprocess(
  value => (value === '' ? undefined : value),
  z.coerce.date().nullable().optional()
)

export const taskCreateSchema = z.object({
  projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional(),
  assignedTo: z.number().int('L\'ID utilisateur doit être un entier').positive('L\'ID utilisateur doit être positif').optional(),
  title: z.string().min(1, 'Le titre est requis').max(255, 'Le titre est trop long'),
  notes: z.string().optional().or(z.literal('')),
  dueDate: optionalDateSchema,
  priority: z.enum(taskPriorities).default('low'),
  workspace: taskWorkspaceSchema.default('externe')
})

export const taskUpdateSchema = z.object({
  projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional(),
  assignedTo: z.number().int('L\'ID utilisateur doit être un entier').positive('L\'ID utilisateur doit être positif').optional(),
  title: z.string().min(1, 'Le titre ne peut pas être vide').max(255, 'Le titre est trop long').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  dueDate: nullableDateSchema,
  status: taskStatusSchema.default('todo').optional(),
  priority: z.enum(taskPriorities).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni'
})

export const taskIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export const taskDashboardQuerySchema = z.object({
  workspace: taskWorkspaceSchema.default('externe')
})

export type TaskCreate = z.infer<typeof taskCreateSchema>
export type TaskUpdate = z.infer<typeof taskUpdateSchema>
export type TaskId = z.infer<typeof taskIdSchema>
