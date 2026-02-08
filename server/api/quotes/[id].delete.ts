import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { quotesTable } from '~/db/schema/quotes'
import { quoteIdSchema } from '~/validation/quotes'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, quoteIdSchema.parse)

  await db.delete(quotesTable).where(eq(quotesTable.id, id))

  setResponseStatus(event, 204)
  return null
})
