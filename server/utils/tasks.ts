import { eq, inArray } from 'drizzle-orm'
import { db } from '~/db'
import { taskAssigneesTable } from '~/db/schema/task-assignees'

// Attaches each task's assignee ids in a single query, grouped in memory - avoids an N+1 select
// when annotating a list of tasks.
export const withTaskAssigneeIds = async <T extends { id: number }>(tasks: T[]): Promise<(T & { assigneeIds: number[] })[]> => {
  if (tasks.length === 0) return []

  const rows = await db
    .select({ taskId: taskAssigneesTable.taskId, userId: taskAssigneesTable.userId })
    .from(taskAssigneesTable)
    .where(inArray(taskAssigneesTable.taskId, tasks.map(task => task.id)))

  const assigneeIdsByTaskId = new Map<number, number[]>()
  rows.forEach((row) => {
    assigneeIdsByTaskId.set(row.taskId, [...(assigneeIdsByTaskId.get(row.taskId) ?? []), row.userId])
  })

  return tasks.map(task => ({ ...task, assigneeIds: assigneeIdsByTaskId.get(task.id) ?? [] }))
}

export const getTaskAssigneeIds = async (taskId: number): Promise<number[]> => {
  const rows = await db
    .select({ userId: taskAssigneesTable.userId })
    .from(taskAssigneesTable)
    .where(eq(taskAssigneesTable.taskId, taskId))

  return rows.map(row => row.userId)
}
