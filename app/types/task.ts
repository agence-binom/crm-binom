import type { TaskPriority, TaskStatus, TaskWorkspace } from '~/constants/tasks'

export type Task = {
  id: number
  projectId: number | null
  assigneeIds: number[]
  title: string
  notes: string | null
  status: TaskStatus
  priority: TaskPriority
  workspace: TaskWorkspace
  dueDate: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}
