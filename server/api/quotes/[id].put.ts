import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { quotesTable } from '~/db/schema/quotes'
import { quoteIdSchema, quoteUpdateSchema } from '~/validation/quotes'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, quoteIdSchema.parse)
  const body = await readValidatedBody(event, quoteUpdateSchema.parse)

  const [quote] = await db
    .update(quotesTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(quotesTable.id, id))
    .returning()

  if (!quote) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Devis non trouvé'
    })
  }

  return quote
})
