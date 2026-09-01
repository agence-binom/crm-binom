import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '~/db'
import { billingDocumentsTable } from '~/db/schema/billing-documents'
import { documentsTable } from '~/db/schema/documents'
import { billingDocumentUploadMetadataSchema } from '~/validation/billing-documents'
import { buildDocumentStoragePath, uploadDocumentFile, deleteUploadedDocumentIfExists, assertValidDocumentFile } from '~~/server/utils/documents'

// Uploads the PDF for a billing step. If a file-less record already exists for this exact step
// (created via POST /api/billing-documents to set a status ahead of the upload), the file attaches
// to that same record - preserving whatever status/date/description was already set - instead of
// creating a duplicate. Otherwise a fresh billing_documents record is created alongside the file.
export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)
  const fileEntry = formData.get('file')

  if (!(fileEntry instanceof File)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Aucun fichier fourni'
    })
  }

  assertValidDocumentFile(fileEntry)

  const metadata = billingDocumentUploadMetadataSchema.parse({
    projectId: formData.get('projectId'),
    documentType: formData.get('documentType'),
    subtype: formData.get('subtype') || undefined,
    externalUrl: formData.get('externalUrl'),
    name: formData.get('name'),
    description: formData.get('description')
  })

  const filepath = await buildDocumentStoragePath(
    'project',
    metadata.projectId,
    fileEntry.name,
    metadata.documentType
  )
  await uploadDocumentFile(event, filepath, fileEntry)

  try {
    const billingDocument = await db.transaction(async (tx) => {
      const [document] = await tx.insert(documentsTable)
        .values({
          name: metadata.name?.trim() || fileEntry.name,
          filename: fileEntry.name,
          filepath,
          mimetype: fileEntry.type,
          size: fileEntry.size,
          entityType: 'project',
          entityId: metadata.projectId,
          description: metadata.description?.trim() || ''
        })
        .returning()

      if (!document) {
        throw createError({ statusCode: 500, statusMessage: 'Impossible d\'enregistrer le fichier en base' })
      }

      const [existingStep] = await tx.select()
        .from(billingDocumentsTable)
        .where(and(
          eq(billingDocumentsTable.projectId, metadata.projectId),
          eq(billingDocumentsTable.documentType, metadata.documentType),
          metadata.subtype ? eq(billingDocumentsTable.subtype, metadata.subtype) : isNull(billingDocumentsTable.subtype),
          isNull(billingDocumentsTable.documentId)
        ))
        .orderBy(desc(billingDocumentsTable.createdAt))
        .limit(1)

      if (existingStep) {
        const [updated] = await tx.update(billingDocumentsTable)
          .set({
            documentId: document.id,
            externalUrl: metadata.externalUrl?.trim() || existingStep.externalUrl,
            description: metadata.description?.trim() || existingStep.description,
            updatedAt: new Date()
          })
          .where(eq(billingDocumentsTable.id, existingStep.id))
          .returning()

        return { ...updated!, ...document, id: updated!.id }
      }

      const [created] = await tx.insert(billingDocumentsTable)
        .values({
          projectId: metadata.projectId,
          documentType: metadata.documentType,
          subtype: metadata.subtype ?? null,
          status: 'draft',
          externalUrl: metadata.externalUrl?.trim() || null,
          description: metadata.description?.trim() || '',
          documentId: document.id
        })
        .returning()

      return { ...created!, ...document, id: created!.id }
    })

    return billingDocument
  } catch (error) {
    await deleteUploadedDocumentIfExists(event, filepath)
    throw error
  }
})
