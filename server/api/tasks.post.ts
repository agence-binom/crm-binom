import { db } from '~/db'
import { tasksTable } from '~/db/schema/tasks'
import { taskCreateSchema } from '~/validation/tasks'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, taskCreateSchema.parse)
  const [task] = await db.insert(tasksTable).values(body).returning()
  return task
})
