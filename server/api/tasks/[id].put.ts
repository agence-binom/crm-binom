import { eq } from 'drizzle-orm'
import type { TaskStatus } from '~/constants/tasks'
import { db } from '~/db'
import { tasksTable } from '~/db/schema/tasks'
import { resolveTaskLifecycleDates } from '~/lib/tasks'
import { taskIdSchema, taskUpdateSchema } from '~/validation/tasks'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, taskIdSchema.parse)
  const body = await readValidatedBody(event, taskUpdateSchema.parse)
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

  const [task] = await db
    .update(tasksTable)
    .set({
      ...body,
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

  return task
})
