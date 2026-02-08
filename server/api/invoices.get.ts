import { db } from '~/db'
import { invoicesTable } from '~/db/schema/invoices'

export default defineEventHandler(async () => {
  const invoices = await db.select().from(invoicesTable)
  return { invoices }
})
