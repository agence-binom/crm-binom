import { eq, and } from 'drizzle-orm'
import { db } from '~/db'
import { documentsTable } from '~/db/schema/documents'
import { documentEntityParamsSchema, documentListQuerySchema } from '~/validation/documents'
import { withDocumentsDownloadUrls } from '~~/server/utils/documents'

export default defineEventHandler(async (event) => {
  const { entityType, entityId } = await getValidatedRouterParams(event, documentEntityParamsSchema.parse)
  const query = documentListQuerySchema.parse(getQuery(event))
  const filters = [
    eq(documentsTable.entityType, entityType),
    eq(documentsTable.entityId, entityId)
  ]

  if (query.documentType) {
    filters.push(eq(documentsTable.documentType, query.documentType))
  }

  const documents = await db
    .select()
    .from(documentsTable)
    .where(and(...filters))

  return { documents: await withDocumentsDownloadUrls(event, documents) }
})
