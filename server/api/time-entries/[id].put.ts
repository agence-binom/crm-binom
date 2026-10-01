import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { timeEntriesTable } from '~/db/schema/time-entries'
import { timeEntryIdSchema, timeEntryUpdateSchema } from '~/validation/time-entries'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'
import { resolveTimeEntryProjectId } from '~~/server/utils/time-entries'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, timeEntryIdSchema.parse)
  const body = await readValidatedBody(event, timeEntryUpdateSchema.parse)
  const taskProjectId = body.taskId ? await resolveTimeEntryProjectId(body.taskId) : undefined

  const [updated] = await db
    .update(timeEntriesTable)
    .set({
      ...body,
      ...(taskProjectId !== undefined ? { projectId: taskProjectId } : {}),
      updatedBy: getAppUser(event).id,
      updatedAt: new Date()
    })
    .where(eq(timeEntriesTable.id, id))
    .returning()

  if (!updated) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Temps passé non trouvé'
    })
  }

  void logActivity(event, { entityType: 'time_entry', entityId: id, action: 'update', metadata: { name: updated.notes } })

  return { ...updated }
})
