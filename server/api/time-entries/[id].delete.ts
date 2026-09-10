import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { timeEntriesTable } from '~/db/schema/time-entries'
import { timeEntryIdSchema } from '~/validation/time-entries'
import { logActivity } from '~~/server/utils/activity-log'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, timeEntryIdSchema.parse)

  const [deleted] = await db.delete(timeEntriesTable).where(eq(timeEntriesTable.id, id)).returning()

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Temps passé non trouvée'
    })
  }

  void logActivity(event, { entityType: 'timeEntry', entityId: id, action: 'delete', metadata: { name: deleted.notes } })

  setResponseStatus(event, 204)
  return null
})
