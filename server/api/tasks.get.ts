import { db } from '~/db'
import { tasksTable } from '~/db/schema/tasks'

export default defineEventHandler(async () => {
  const tasks = await db.select().from(tasksTable)
  return { tasks }
})
