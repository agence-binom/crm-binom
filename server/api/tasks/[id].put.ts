import { eq } from 'drizzle-orm'
import type { TaskStatus } from '~/constants/tasks'
import { db } from '~/db'
import { taskAssigneesTable } from '~/db/schema/task-assignees'
import { tasksTable } from '~/db/schema/tasks'
import { resolveTaskLifecycleDates } from '~/lib/tasks'
import { taskIdSchema, taskUpdateSchema } from '~/validation/tasks'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, taskIdSchema.parse)
  const { assigneeIds, ...body } = await readValidatedBody(event, taskUpdateSchema.parse)
  const [currentTask] = await db.select().from(tasksTable).where(eq(tasksTable.id, id))

  if (!currentTask) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tâche non trouvée'
    })
  }

  const currentStatus = currentTask.status as TaskStatus
  const nextStatus = (body.status ?? currentTask.status) as TaskStatus
  const lifecycleDates = body.status
    ? resolveTaskLifecycleDates({
        currentStatus,
        nextStatus,
        startedAt: currentTask.startedAt,
        completedAt: currentTask.completedAt
      })
    : {
        startedAt: currentTask.startedAt,
        completedAt: currentTask.completedAt
      }

  const { task, finalAssigneeIds } = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(tasksTable)
      .set({
        ...body,
        updatedBy: getAppUser(event).id,
        updatedAt: new Date(),
        ...(body.status
          ? {
              startedAt: lifecycleDates.startedAt,
              completedAt: lifecycleDates.completedAt
            }
          : {}
        )
      })
      .where(eq(tasksTable.id, id))
      .returning()

    // `assigneeIds` omitted means "leave assignees untouched" (see taskUpdateSchema) - the whole
    // array is the source of truth when provided, not an incremental add/remove.
    if (assigneeIds !== undefined) {
      await tx.delete(taskAssigneesTable).where(eq(taskAssigneesTable.taskId, id))
      if (assigneeIds.length > 0) {
        await tx.insert(taskAssigneesTable).values(assigneeIds.map(userId => ({ taskId: id, userId })))
      }
    }

    const currentAssigneeIds = assigneeIds ?? (await tx
      .select({ userId: taskAssigneesTable.userId })
      .from(taskAssigneesTable)
      .where(eq(taskAssigneesTable.taskId, id))
    ).map(row => row.userId)

    return { task: updated, finalAssigneeIds: currentAssigneeIds }
  })

  void logActivity(event, { entityType: 'task', entityId: id, action: 'update', metadata: { name: task!.title } })

  return { ...task, assigneeIds: finalAssigneeIds }
})
