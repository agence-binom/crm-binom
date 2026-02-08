import { db } from '~/db'
import { documentsTable } from '~/db/schema/documents'

export default defineEventHandler(async () => {
  const documents = await db.select().from(documentsTable)
  return { documents }
})
