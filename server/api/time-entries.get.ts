import { db } from '~/db'
import { timeEntriesTable } from '~/db/schema/time-entries'

export default defineEventHandler(async () => {
  const timeEntries = await db.select().from(timeEntriesTable)
  return { timeEntries }
})
