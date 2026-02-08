import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { quotesTable } from '~/db/schema/quotes'

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'id')

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID projet requis'
    })
  }

  const quotes = await db.select().from(quotesTable).where(eq(quotesTable.projectId, parseInt(projectId)))
  return { quotes }
})
