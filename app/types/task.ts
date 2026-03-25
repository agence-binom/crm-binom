import type { TaskPriority, TaskStatus, TaskWorkflowTag } from '~/constants/tasks'

export type Task = {
  id: number
  projectId: number | null
  assignedTo: number | null
  title: string
  notes: string | null
  status: TaskStatus
  workflowTag: TaskWorkflowTag | null
  priority: TaskPriority
  dueDate: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}
