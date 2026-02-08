import { db } from '~/db'
import { invoicesTable } from '~/db/schema/invoices'
import { invoiceCreateSchema } from '~/validation/invoices'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, invoiceCreateSchema.parse)
  const [invoice] = await db.insert(invoicesTable).values(body).returning()
  return invoice
})
