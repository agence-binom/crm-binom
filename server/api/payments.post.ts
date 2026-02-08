import { db } from '~/db'
import { paymentsTable } from '~/db/schema/payments'
import { paymentCreateSchema } from '~/validation/payments'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, paymentCreateSchema.parse)
  const [payment] = await db.insert(paymentsTable).values(body).returning()
  return payment
})
