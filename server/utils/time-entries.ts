import { desc, eq, getTableColumns, inArray, sql, sum } from 'drizzle-orm'
import { db } from '~/db'
import { tasksTable } from '~/db/schema/tasks'
import { timeEntriesTable } from '~/db/schema/time-entries'

// Projet effectif d'une saisie : celui de sa tâche quand elle en a une (la tâche peut changer de
// projet, c'est elle qui fait foi), sinon le projectId de la saisie - saisie directe sur le projet,
// ou tâche supprimée depuis (taskId passe à null, le projectId recopié à la création prend le relais).
// Suppose un leftJoin sur tasksTable.
const effectiveProjectId = sql<number | null>`coalesce(${tasksTable.projectId}, ${timeEntriesTable.projectId})`

export const resolveTimeEntryProjectId = async (taskId: number) => {
  const [task] = await db
    .select({ projectId: tasksTable.projectId })
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))

  return task?.projectId ?? null
}

export const getProjectTimeEntries = (projectId: number) => db
  .select({ ...getTableColumns(timeEntriesTable), taskTitle: tasksTable.title })
  .from(timeEntriesTable)
  .leftJoin(tasksTable, eq(timeEntriesTable.taskId, tasksTable.id))
  .where(eq(effectiveProjectId, projectId))
  .orderBy(desc(timeEntriesTable.createdAt))

export const withProjectTimeSpent = async <T extends { id: number }>(projects: T[]): Promise<(T & { timeSpent: number })[]> => {
  if (projects.length === 0) return []

  const rows = await db
    .select({ projectId: effectiveProjectId, total: sum(timeEntriesTable.duration).mapWith(Number) })
    .from(timeEntriesTable)
    .leftJoin(tasksTable, eq(timeEntriesTable.taskId, tasksTable.id))
    .where(inArray(effectiveProjectId, projects.map(project => project.id)))
    .groupBy(effectiveProjectId)

  const timeSpentByProjectId = new Map(rows.map(row => [Number(row.projectId), row.total]))

  return projects.map(project => ({ ...project, timeSpent: timeSpentByProjectId.get(project.id) ?? 0 }))
}
