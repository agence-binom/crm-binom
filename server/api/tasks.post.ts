import { db } from '~/db'
import { tasksTable } from '~/db/schema'
import { taskCreateSchema } from '~/db/schema/validation'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, taskCreateSchema.parse)
  const [task] = await db.insert(tasksTable).values(body).returning()
  return task
})
