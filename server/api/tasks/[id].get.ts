import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { tasksTable } from '~/db/schema'
import { taskIdSchema } from '~/db/schema/validation'

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
