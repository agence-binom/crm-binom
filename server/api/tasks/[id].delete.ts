import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { tasksTable } from '~/db/schema/tasks'
import { taskIdSchema } from '~/validation/tasks'
import { logActivity } from '~~/server/utils/activity-log'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, taskIdSchema.parse)

  const [deleted] = await db.delete(tasksTable).where(eq(tasksTable.id, id)).returning()

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tâche non trouvée'
    })
  }

  void logActivity(event, { entityType: 'task', entityId: id, action: 'delete', metadata: { name: deleted.title } })

  setResponseStatus(event, 204)
  return null
})
