import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { documentsTable } from '~/db/schema/documents'
import { documentIdSchema } from '~/validation/documents'
import { withDocumentDownloadUrl } from '~~/server/utils/documents'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, documentIdSchema.parse)

  const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, id))

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document non trouvé'
    })
  }

  return await withDocumentDownloadUrl(event, document)
})
