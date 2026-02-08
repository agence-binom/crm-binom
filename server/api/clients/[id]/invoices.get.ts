import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { invoicesTable } from '~/db/schema/invoices'

export default defineEventHandler(async (event) => {
  const clientId = getRouterParam(event, 'clientId')

  if (!clientId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID client requis'
    })
  }

  const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.clientId, parseInt(clientId)))
  return { invoices }
})
