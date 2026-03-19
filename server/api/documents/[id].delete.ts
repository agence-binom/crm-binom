import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { documentsTable } from '~/db/schema/documents'
import { documentIdSchema } from '~/validation/documents'
import { deleteStoredDocumentFile } from '~~/server/utils/documents'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, documentIdSchema.parse)
  const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, id))

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document non trouvé'
    })
  }

  await deleteStoredDocumentFile(event, document.filepath)
  await db.delete(documentsTable).where(eq(documentsTable.id, id))

  setResponseStatus(event, 204)
  return null
})
