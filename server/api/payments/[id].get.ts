import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { paymentsTable } from '~/db/schema/payments'
import { paymentIdSchema } from '~/validation/payments'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, paymentIdSchema.parse)

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, id))

  if (!payment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Paiement non trouvé'
    })
  }

  return payment
})
