export const taskStatuses = [
  'todo',
  'in_progress',
  'waiting',
  'validation',
  'done'
] as const

export type TaskStatus = typeof taskStatuses[number]

export const taskPriorities = [
  'low',
  'medium',
  'high'
] as const

export type TaskPriority = typeof taskPriorities[number]

export const taskWaitingWorkflowTags = [
  'information',
  'budget',
  'dependency'
] as const

export const taskValidationWorkflowTags = [
  'binom',
  'client'
] as const

export const taskWorkflowTags = [
  'information',
  'budget',
  'dependency',
  'binom',
  'client'
] as const

export type TaskWorkflowTag = typeof taskWorkflowTags[number]
