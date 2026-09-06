import { eq, and } from 'drizzle-orm'
import { db } from '~/db'
import { documentsTable } from '~/db/schema/documents'
import { documentEntityParamsSchema } from '~/validation/documents'
import { withDocumentsDownloadUrls } from '~~/server/utils/documents'

export default defineEventHandler(async (event) => {
  const { entityType, entityId } = await getValidatedRouterParams(event, documentEntityParamsSchema.parse)

  const documents = await db
    .select()
    .from(documentsTable)
    .where(and(
      eq(documentsTable.entityType, entityType),
      eq(documentsTable.entityId, entityId)
    ))

  return { documents: await withDocumentsDownloadUrls(event, documents) }
})
