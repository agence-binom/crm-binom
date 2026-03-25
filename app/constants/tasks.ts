export const taskStatuses = [
  'todo',
  'in_progress',
  'waiting',
  'validationBinom',
  'validationClient',
  'done'
] as const

export type TaskStatus = typeof taskStatuses[number]

export const taskPriorities = [
  'low',
  'medium',
  'high'
] as const

export type TaskPriority = typeof taskPriorities[number]
