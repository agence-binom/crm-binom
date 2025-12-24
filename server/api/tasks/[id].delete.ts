import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { tasksTable } from '~/db/schema'
import { taskIdSchema } from '~/validation/tasks'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, taskIdSchema.parse)

  await db.delete(tasksTable).where(eq(tasksTable.id, id))

  setResponseStatus(event, 204)
  return null
})
