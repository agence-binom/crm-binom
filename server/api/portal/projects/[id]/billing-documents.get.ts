import { desc, eq } from 'drizzle-orm'
import { db } from '~/db'
import { billingDocumentsTable } from '~/db/schema/billing-documents'
import { documentsTable } from '~/db/schema/documents'
import { annotateDocumentLifecycle, type BillingDocumentType } from '~/lib/documents'
import { projectIdSchema } from '~/validation/projects'
import { withDocumentsDownloadUrls } from '~~/server/utils/documents'
import { getPortalClient, requirePortalProject } from '~~/server/utils/client-portal'

// Draft steps ("à émettre") are internal-only - the client should only ever see a step once it's
// actually moved (sent/completed/refused/cancelled/non_applicable), and only its current version -
// an older, superseded revision (e.g. a re-issued Devis) would just be confusing here.
export default defineEventHandler(async (event) => {
  const client = getPortalClient(event)
  const { id: projectId } = await getValidatedRouterParams(event, projectIdSchema.parse)

  await requirePortalProject(client.id, projectId)

  const rows = await db
    .select({
      id: billingDocumentsTable.id,
      projectId: billingDocumentsTable.projectId,
      documentType: billingDocumentsTable.documentType,
      subtype: billingDocumentsTable.subtype,
      status: billingDocumentsTable.status,
      statusDate: billingDocumentsTable.statusDate,
      description: billingDocumentsTable.description,
      documentId: billingDocumentsTable.documentId,
      createdAt: billingDocumentsTable.createdAt,
      filename: documentsTable.filename,
      filepath: documentsTable.filepath,
      mimetype: documentsTable.mimetype,
      size: documentsTable.size,
      documentDescription: documentsTable.description,
      documentCreatedAt: documentsTable.createdAt
    })
    .from(billingDocumentsTable)
    .leftJoin(documentsTable, eq(billingDocumentsTable.documentId, documentsTable.id))
    .where(eq(billingDocumentsTable.projectId, projectId))
    .orderBy(desc(billingDocumentsTable.createdAt))

  // Lifecycle must be computed over every revision (drafts included) - a newer draft revision
  // still supersedes the previous sent/completed one, even though the draft itself stays hidden
  // from the client below. Filtering drafts out beforehand would leave that superseded revision
  // looking "current" and expose it.
  const annotatedRows = annotateDocumentLifecycle(rows.map(row => ({ ...row, type: row.documentType as BillingDocumentType })))
  const currentRows = annotatedRows.filter(row => row.lifecycle === 'current' && row.status !== 'draft')

  const documents = await withDocumentsDownloadUrls(event, currentRows)

  return { documents }
})
