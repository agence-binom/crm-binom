import { db } from '~/db'
import { billingDocumentsTable } from '~/db/schema/billing-documents'
import { billingDocumentCreateSchema } from '~/validation/billing-documents'

// Creates a billing step record with no attached file yet — the workflow status/date/description
// for a step (e.g. marking "Devis: Validée" ahead of attaching the PDF, or explicitly marking a
// step "Non applicable" with an explanatory description). File uploads go through
// POST /api/billing-documents/upload instead.
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, billingDocumentCreateSchema.parse)

  const [billingDocument] = await db.insert(billingDocumentsTable)
    .values({
      projectId: body.projectId,
      documentType: body.documentType,
      subtype: body.subtype ?? null,
      status: body.status,
      statusDate: body.statusDate,
      externalUrl: body.externalUrl?.trim() || null,
      description: body.description?.trim() || ''
    })
    .returning()

  if (!billingDocument) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible d\'enregistrer l\'étape en base'
    })
  }

  return billingDocument
})
