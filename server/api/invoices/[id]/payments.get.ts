import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { paymentsTable } from '~/db/schema/payments'

export default defineEventHandler(async (event) => {
  const invoiceId = getRouterParam(event, 'id')

  if (!invoiceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID facture requis'
    })
  }

  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.invoiceId, parseInt(invoiceId)))
  return { payments }
})
