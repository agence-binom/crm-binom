import { db } from '~/db'
import { quotesTable } from '~/db/schema/quotes'
import { quoteCreateSchema } from '~/validation/quotes'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, quoteCreateSchema.parse)
  const [quote] = await db.insert(quotesTable).values(body).returning()
  return quote
})
