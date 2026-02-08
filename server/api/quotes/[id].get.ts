import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { quotesTable } from '~/db/schema/quotes'
import { quoteIdSchema } from '~/validation/quotes'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, quoteIdSchema.parse)

  const [quote] = await db.select().from(quotesTable).where(eq(quotesTable.id, id))

  if (!quote) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Devis non trouvé'
    })
  }

  return quote
})
