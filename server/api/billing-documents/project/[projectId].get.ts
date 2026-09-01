import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { billingDocumentsTable } from '~/db/schema/billing-documents'
import { documentsTable } from '~/db/schema/documents'
import { billingDocumentProjectParamsSchema } from '~/validation/billing-documents'
import { withDocumentsDownloadUrls } from '~~/server/utils/documents'

export default defineEventHandler(async (event) => {
  const { projectId } = await getValidatedRouterParams(event, billingDocumentProjectParamsSchema.parse)

  const rows = await db
    .select({
      id: billingDocumentsTable.id,
      projectId: billingDocumentsTable.projectId,
      documentType: billingDocumentsTable.documentType,
      subtype: billingDocumentsTable.subtype,
      status: billingDocumentsTable.status,
      statusDate: billingDocumentsTable.statusDate,
      externalUrl: billingDocumentsTable.externalUrl,
      description: billingDocumentsTable.description,
      documentId: billingDocumentsTable.documentId,
      createdAt: billingDocumentsTable.createdAt,
      updatedAt: billingDocumentsTable.updatedAt,
      filename: documentsTable.filename,
      filepath: documentsTable.filepath,
      mimetype: documentsTable.mimetype,
      size: documentsTable.size
    })
    .from(billingDocumentsTable)
    .leftJoin(documentsTable, eq(billingDocumentsTable.documentId, documentsTable.id))
    .where(eq(billingDocumentsTable.projectId, projectId))

  const documents = await withDocumentsDownloadUrls(
    event,
    rows.map(row => ({ ...row, filepath: row.filepath }))
  )

  return { documents }
})
