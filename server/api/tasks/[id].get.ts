import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { tasksTable } from '~/db/schema/tasks'
import { taskIdSchema } from '~/validation/tasks'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, taskIdSchema.parse)

  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id))

  if (!task) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tâche non trouvée'
    })
  }

  return task
})
