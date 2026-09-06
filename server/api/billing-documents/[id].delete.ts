import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { billingDocumentsTable } from '~/db/schema/billing-documents'
import { documentsTable } from '~/db/schema/documents'
import { billingDocumentIdSchema } from '~/validation/billing-documents'
import { getBillingDocumentLabel } from '~/lib/documents'
import { deleteStoredDocumentFile } from '~~/server/utils/documents'
import { logActivity } from '~~/server/utils/activity-log'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, billingDocumentIdSchema.parse)

  const [existing] = await db.select().from(billingDocumentsTable).where(eq(billingDocumentsTable.id, id))

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document de facturation non trouvé'
    })
  }

  if (existing.documentId) {
    const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, existing.documentId))
    if (document) {
      await deleteStoredDocumentFile(event, document.filepath)
      await db.delete(documentsTable).where(eq(documentsTable.id, existing.documentId))
    }
  }

  await db.delete(billingDocumentsTable).where(eq(billingDocumentsTable.id, id))

  void logActivity(event, { entityType: 'billing_document', entityId: id, action: 'delete', metadata: { name: getBillingDocumentLabel(existing) } })

  setResponseStatus(event, 204)
  return null
})
