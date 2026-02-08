import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { invoicesTable } from '~/db/schema/invoices'
import { invoiceIdSchema, invoiceUpdateSchema } from '~/validation/invoices'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, invoiceIdSchema.parse)
  const body = await readValidatedBody(event, invoiceUpdateSchema.parse)

  const [invoice] = await db
    .update(invoicesTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(invoicesTable.id, id))
    .returning()

  if (!invoice) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Facture non trouvée'
    })
  }

  return invoice
})
