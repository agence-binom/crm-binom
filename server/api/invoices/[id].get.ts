import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { invoicesTable } from '~/db/schema/invoices'
import { invoiceIdSchema } from '~/validation/invoices'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, invoiceIdSchema.parse)

  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id))

  if (!invoice) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Facture non trouvée'
    })
  }

  return invoice
})
