import type { TaskPriority, TaskStatus } from '../constants/tasks'

export type TaskWithDueDate = {
  dueDate: string | null
}

export type TaskLifecycleInput = {
  currentStatus: TaskStatus
  nextStatus: TaskStatus
  startedAt?: Date | null
  completedAt?: Date | null
  now?: Date
}

function getDueDateTimestamp(dueDate: string | null) {
  if (!dueDate) {
    return Number.POSITIVE_INFINITY
  }

  const timestamp = new Date(dueDate).getTime()
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp
}

export function compareTasksByDueDate<T extends TaskWithDueDate>(left: T, right: T) {
  return getDueDateTimestamp(left.dueDate) - getDueDateTimestamp(right.dueDate)
}

export function sortTasksByDueDate<T extends TaskWithDueDate>(tasks: T[]) {
  return [...tasks].sort(compareTasksByDueDate)
}

export function getTaskStatusLabel(status: TaskStatus) {
  switch (status) {
    case 'in_progress':
      return 'En cours'
    case 'waiting':
      return 'En attente'
    case 'validationBinom':
      return 'À valider par binōm'
    case 'validationClient':
      return 'À valider par le client'
    case 'done':
      return 'Terminée'
    default:
      return 'À faire'
  }
}

export function getTaskStatusIcon(status: TaskStatus) {
  switch (status) {
    case 'in_progress':
      return 'i-lucide-loader'
    case 'waiting':
      return 'i-lucide-clock'
    case 'validationBinom':
      return 'i-lucide-eye'
    case 'validationClient':
      return 'i-lucide-user-check'
    case 'done':
      return 'i-lucide-circle-check'
    default:
      return 'i-lucide-circle'
  }
}

export function getTaskStatusClass(status: TaskStatus) {
  switch (status) {
    case 'in_progress':
      return 'bg-blue-100 text-blue-700 ring-blue-200'
    case 'waiting':
      return 'bg-amber-100 text-amber-700 ring-amber-200'
    case 'validationBinom':
      return 'bg-violet-100 text-violet-700 ring-violet-200'
    case 'validationClient':
      return 'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200'
    case 'done':
      return 'bg-emerald-100 text-emerald-700 ring-emerald-200'
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-200'
  }
}

export function getTaskPriorityLabel(priority: TaskPriority) {
  switch (priority) {
    case 'high':
      return 'Haute'
    case 'medium':
      return 'Moyenne'
    default:
      return 'Basse'
  }
}

export function getTaskPriorityIcon(priority: TaskPriority) {
  switch (priority) {
    case 'high':
      return 'i-lucide-alert-triangle'
    case 'medium':
      return 'i-lucide-gauge'
    default:
      return 'i-lucide-feather'
  }
}

export function getTaskPriorityClass(priority: TaskPriority) {
  switch (priority) {
    case 'high':
      return 'bg-rose-100 text-rose-700 ring-rose-200'
    case 'medium':
      return 'bg-amber-100 text-amber-700 ring-amber-200'
    default:
      return 'bg-emerald-100 text-emerald-700 ring-emerald-200'
  }
}

export function resolveTaskLifecycleDates({
  currentStatus,
  nextStatus,
  startedAt,
  completedAt,
  now = new Date()
}: TaskLifecycleInput) {
  const isLeavingDone = currentStatus === 'done' && nextStatus !== 'done'
  const nextValues = {
    startedAt: startedAt ?? null,
    completedAt: completedAt ?? null
  }

  if (currentStatus === nextStatus) {
    return nextValues
  }

  if (currentStatus === 'todo' && nextStatus !== 'todo' && !nextValues.startedAt) {
    nextValues.startedAt = now
  }

  if (nextStatus === 'done') {
    nextValues.completedAt = now
    if (!nextValues.startedAt) {
      nextValues.startedAt = now
    }
    return nextValues
  }

  if (isLeavingDone) {
    nextValues.completedAt = null
  }

  return nextValues
}
