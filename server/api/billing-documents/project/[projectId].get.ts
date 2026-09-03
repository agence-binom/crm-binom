import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { billingDocumentsTable } from '~/db/schema/billing-documents'
import { documentsTable } from '~/db/schema/documents'
import { annotateDocumentLifecycle, type BillingDocumentType } from '~/lib/documents'
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

  // Annotated here so every consumer (the project detail timeline, the billing edit panel)
  // reads `lifecycle` straight off the response instead of recomputing it client-side.
  const annotatedRows = annotateDocumentLifecycle(rows.map(row => ({ ...row, type: row.documentType as BillingDocumentType })))

  const documents = await withDocumentsDownloadUrls(
    event,
    annotatedRows.map(row => ({ ...row, filepath: row.filepath }))
  )

  return { documents }
})
