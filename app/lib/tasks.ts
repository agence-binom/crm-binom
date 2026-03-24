export type TaskWithDueDate = {
  dueDate: string | null
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
