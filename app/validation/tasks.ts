import { z } from 'zod'

export const taskCreateSchema = z.object({
  projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional(),
  assignedTo: z.number().int('L\'ID utilisateur doit être un entier').positive('L\'ID utilisateur doit être positif').optional(),
  title: z.string().min(1, 'Le titre est requis').max(255, 'Le titre est trop long'),
  notes: z.string().optional().or(z.literal('')),
  dueDate: z.coerce.date().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo')
})

export const taskUpdateSchema = z.object({
  projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional(),
  assignedTo: z.number().int('L\'ID utilisateur doit être un entier').positive('L\'ID utilisateur doit être positif').optional(),
  title: z.string().min(1, 'Le titre ne peut pas être vide').max(255, 'Le titre est trop long').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  dueDate: z.coerce.date().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo').optional()

}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' }
)

export const taskIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export type TaskCreate = z.infer<typeof taskCreateSchema>
export type TaskUpdate = z.infer<typeof taskUpdateSchema>
export type TaskId = z.infer<typeof taskIdSchema>

export type Task = {
  id: number
  projectId: number | null
  assignedTo: number | null
  title: string
  notes: string | null
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  updatedAt: string
}
