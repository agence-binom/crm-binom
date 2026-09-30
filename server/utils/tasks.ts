import { eq, inArray, sum } from 'drizzle-orm'
import { db } from '~/db'
import { taskAssigneesTable } from '~/db/schema/task-assignees'
import { timeEntriesTable } from '~/db/schema/time-entries'

export const getTaskAssigneeIds = async (taskId: number): Promise<number[]> => {
  const rows = await db
    .select({ userId: taskAssigneesTable.userId })
    .from(taskAssigneesTable)
    .where(eq(taskAssigneesTable.taskId, taskId))

  return rows.map(row => row.userId)
}

// Assignés et cumul du temps passé (en minutes) de chaque tâche : une requête par annotation,
// lancées en parallèle et regroupées en mémoire - évite un N+1 sur une liste de tâches.
export const annotateTasks = async <T extends { id: number }>(tasks: T[]): Promise<(T & { assigneeIds: number[], timeSpent: number })[]> => {
  if (tasks.length === 0) return []

  const taskIds = tasks.map(task => task.id)
  const [assigneeRows, timeSpentRows] = await Promise.all([
    db
      .select({ taskId: taskAssigneesTable.taskId, userId: taskAssigneesTable.userId })
      .from(taskAssigneesTable)
      .where(inArray(taskAssigneesTable.taskId, taskIds)),
    db
      .select({ taskId: timeEntriesTable.taskId, total: sum(timeEntriesTable.duration).mapWith(Number) })
      .from(timeEntriesTable)
      .where(inArray(timeEntriesTable.taskId, taskIds))
      .groupBy(timeEntriesTable.taskId)
  ])

  const assigneeIdsByTaskId = new Map<number, number[]>()
  assigneeRows.forEach((row) => {
    assigneeIdsByTaskId.set(row.taskId, [...(assigneeIdsByTaskId.get(row.taskId) ?? []), row.userId])
  })
  const timeSpentByTaskId = new Map(timeSpentRows.map(row => [row.taskId, row.total]))

  return tasks.map(task => ({
    ...task,
    assigneeIds: assigneeIdsByTaskId.get(task.id) ?? [],
    timeSpent: timeSpentByTaskId.get(task.id) ?? 0
  }))
}
