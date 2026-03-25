import { z } from 'zod'
import {
  taskPriorities,
  taskStatuses,
  taskValidationWorkflowTags,
  taskWaitingWorkflowTags,
  taskWorkflowTags
} from '~/constants/tasks'

const taskStatusSchema = z.enum(taskStatuses)
const taskWorkflowTagSchema = z.enum(taskWorkflowTags).optional().or(z.literal(''))

const isWaitingWorkflowTag = (value?: string) => {
  return !!value && taskWaitingWorkflowTags.some(tag => tag === value)
}

const isValidationWorkflowTag = (value?: string) => {
  return !!value && taskValidationWorkflowTags.some(tag => tag === value)
}

const refineTaskWorkflow = (
  data: {
    status?: typeof taskStatuses[number]
    workflowTag?: typeof taskWorkflowTags[number] | '' | undefined
  },
  ctx: z.RefinementCtx,
  requireStatusForWorkflowTag = false
) => {
  const workflowTag = data.workflowTag || undefined

  if (requireStatusForWorkflowTag && workflowTag && !data.status) {
    ctx.addIssue({
      code: 'custom',
      path: ['status'],
      message: 'Le statut est requis pour mettre à jour le tag de workflow'
    })
    return
  }

  if (!data.status) {
    return
  }

  if (data.status === 'waiting') {
    if (!workflowTag) {
      ctx.addIssue({
        code: 'custom',
        path: ['workflowTag'],
        message: 'Un tag est requis pour une tâche en attente'
      })
      return
    }

    if (!isWaitingWorkflowTag(workflowTag)) {
      ctx.addIssue({
        code: 'custom',
        path: ['workflowTag'],
        message: 'Choisissez un tag valide pour une tâche en attente'
      })
    }

    return
  }

  if (data.status === 'validation') {
    if (!workflowTag) {
      ctx.addIssue({
        code: 'custom',
        path: ['workflowTag'],
        message: 'Un tag est requis pour une tâche à valider'
      })
      return
    }

    if (!isValidationWorkflowTag(workflowTag)) {
      ctx.addIssue({
        code: 'custom',
        path: ['workflowTag'],
        message: 'Choisissez un tag valide pour une tâche à valider'
      })
    }

    return
  }

  if (workflowTag) {
    ctx.addIssue({
      code: 'custom',
      path: ['workflowTag'],
      message: 'Ce statut n’utilise pas de tag de workflow'
    })
  }
}

export const taskCreateSchema = z.object({
  projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional(),
  assignedTo: z.number().int('L\'ID utilisateur doit être un entier').positive('L\'ID utilisateur doit être positif').optional(),
  title: z.string().min(1, 'Le titre est requis').max(255, 'Le titre est trop long'),
  notes: z.string().optional().or(z.literal('')),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(taskPriorities).default('low')
})

export const taskUpdateSchema = z.object({
  projectId: z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional(),
  assignedTo: z.number().int('L\'ID utilisateur doit être un entier').positive('L\'ID utilisateur doit être positif').optional(),
  title: z.string().min(1, 'Le titre ne peut pas être vide').max(255, 'Le titre est trop long').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  dueDate: z.coerce.date().optional(),
  status: taskStatusSchema.default('todo').optional(),
  workflowTag: taskWorkflowTagSchema,
  priority: z.enum(taskPriorities).optional()
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' }
).superRefine((data, ctx) => {
  refineTaskWorkflow(data, ctx, true)
})

export const taskIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export type TaskCreate = z.infer<typeof taskCreateSchema>
export type TaskUpdate = z.infer<typeof taskUpdateSchema>
export type TaskId = z.infer<typeof taskIdSchema>
