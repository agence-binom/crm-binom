import { db } from '~/db'
import { timeEntriesTable } from '~/db/schema/time-entries'
import { timeEntryCreateSchema } from '~/validation/time-entries'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { ...body } = await readValidatedBody(event, timeEntryCreateSchema.parse)

  const timeEntry = await db.transaction(async (tx) => {
    const [created] = await tx.insert(timeEntriesTable).values({
      ...body,
      createdBy: getAppUser(event).id
    }).returning()

    if (!created) {
      throw createError({ statusCode: 500, statusMessage: 'Impossible d\'ajouter du temps' })
    }

    return created
  })

  void logActivity(event, { entityType: 'time_entry', entityId: timeEntry.id, action: 'create', metadata: { name: timeEntry.notes } })

  return { ...timeEntry }
})
