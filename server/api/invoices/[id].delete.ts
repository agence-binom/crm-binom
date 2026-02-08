import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { invoicesTable } from '~/db/schema/invoices'
import { invoiceIdSchema } from '~/validation/invoices'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, invoiceIdSchema.parse)

  await db.delete(invoicesTable).where(eq(invoicesTable.id, id))

  setResponseStatus(event, 204)
  return null
})
