import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { tasksTable } from '~/db/schema'
import { taskIdSchema, taskUpdateSchema } from '~/validation/tasks'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, taskIdSchema.parse)
  const body = await readValidatedBody(event, taskUpdateSchema.parse)

  const [task] = await db
    .update(tasksTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(tasksTable.id, id))
    .returning()

  if (!task) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tâche non trouvée'
    })
  }

  return task
})
