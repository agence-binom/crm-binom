import { db } from '~/db'
import { tasksTable } from '~/db/schema/tasks'
import { withTaskAssigneeIds } from '~~/server/utils/tasks'

export default defineEventHandler(async () => {
  const tasks = await db.select().from(tasksTable)
  return { tasks: await withTaskAssigneeIds(tasks) }
})
