import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { billingDocumentsTable } from '~/db/schema/billing-documents'
import { billingDocumentIdSchema, billingDocumentUpdateSchema, documentStatusesByType } from '~/validation/billing-documents'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, billingDocumentIdSchema.parse)
  const body = await readValidatedBody(event, billingDocumentUpdateSchema.parse)

  const [existing] = await db.select().from(billingDocumentsTable).where(eq(billingDocumentsTable.id, id))

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document de facturation non trouvé'
    })
  }

  if (body.status && !documentStatusesByType[existing.documentType as keyof typeof documentStatusesByType]?.includes(body.status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ce statut n\'est pas valide pour ce type de document'
    })
  }

  const [billingDocument] = await db
    .update(billingDocumentsTable)
    .set({
      ...body,
      externalUrl: body.externalUrl !== undefined ? (body.externalUrl.trim() || null) : undefined,
      updatedAt: new Date()
    })
    .where(eq(billingDocumentsTable.id, id))
    .returning()

  return billingDocument
})
