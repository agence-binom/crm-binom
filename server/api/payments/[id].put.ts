import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { paymentsTable } from '~/db/schema/payments'
import { paymentIdSchema, paymentUpdateSchema } from '~/validation/payments'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, paymentIdSchema.parse)
  const body = await readValidatedBody(event, paymentUpdateSchema.parse)

  const [payment] = await db
    .update(paymentsTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(paymentsTable.id, id))
    .returning()

  if (!payment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Paiement non trouvé'
    })
  }

  return payment
})
