import { db } from '~/db'
import { taskAssigneesTable } from '~/db/schema/task-assignees'
import { tasksTable } from '~/db/schema/tasks'
import { taskCreateSchema } from '~/validation/tasks'

export default defineEventHandler(async (event) => {
  const { assigneeIds, ...body } = await readValidatedBody(event, taskCreateSchema.parse)

  const task = await db.transaction(async (tx) => {
    const [created] = await tx.insert(tasksTable).values({
      ...body,
      status: 'todo',
      startedAt: null,
      completedAt: null
    }).returning()

    if (!created) {
      throw createError({ statusCode: 500, statusMessage: 'Impossible de créer la tâche' })
    }

    if (assigneeIds.length > 0) {
      await tx.insert(taskAssigneesTable).values(assigneeIds.map(userId => ({ taskId: created.id, userId })))
    }

    return created
  })

  return { ...task, assigneeIds }
})
