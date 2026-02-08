import { db } from '~/db'
import { quotesTable } from '~/db/schema/quotes'

export default defineEventHandler(async () => {
  const quotes = await db.select().from(quotesTable)
  return { quotes }
})
