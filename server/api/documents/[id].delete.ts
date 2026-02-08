import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { documentsTable } from '~/db/schema/documents'
import { documentIdSchema } from '~/validation/documents'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, documentIdSchema.parse)

  await db.delete(documentsTable).where(eq(documentsTable.id, id))

  setResponseStatus(event, 204)
  return null
})
