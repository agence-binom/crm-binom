import { db } from '~/db'
import { paymentsTable } from '~/db/schema/payments'

export default defineEventHandler(async () => {
  const payments = await db.select().from(paymentsTable)
  return { payments }
})
