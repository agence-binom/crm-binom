import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { paymentsTable } from '~/db/schema/payments'
import { paymentIdSchema } from '~/validation/payments'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, paymentIdSchema.parse)

  await db.delete(paymentsTable).where(eq(paymentsTable.id, id))

  setResponseStatus(event, 204)
  return null
})
