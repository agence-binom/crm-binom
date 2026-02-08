import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { quotesTable } from '~/db/schema/quotes'

export default defineEventHandler(async (event) => {
  const clientId = getRouterParam(event, 'clientId')

  if (!clientId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID client requis'
    })
  }

  const quotes = await db.select().from(quotesTable).where(eq(quotesTable.clientId, parseInt(clientId)))
  return { quotes }
})
