import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { invoicesTable } from '~/db/schema/invoices'

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'id')

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID projet requis'
    })
  }

  const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.projectId, parseInt(projectId)))
  return { invoices }
})
