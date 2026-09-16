import { desc, eq } from 'drizzle-orm'
import { db } from '~/db'
import { timeEntriesTable } from '~/db/schema/time-entries'
import { timeEntryListQuerySchema } from '~/validation/time-entries'

export default defineEventHandler(async (event) => {
  const query = timeEntryListQuerySchema.parse(getQuery(event))

  const timeEntries = await db
    .select()
    .from(timeEntriesTable)
    .where(eq(timeEntriesTable.taskId, query.taskId))
    .orderBy(desc(timeEntriesTable.createdAt))

  return { timeEntries }
})
