import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { documentsTable } from '~/db/schema/documents'
import { documentIdSchema, documentUpdateSchema } from '~/validation/documents'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, documentIdSchema.parse)
  const body = await readValidatedBody(event, documentUpdateSchema.parse)

  const [document] = await db
    .update(documentsTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(documentsTable.id, id))
    .returning()

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document non trouvé'
    })
  }

  return document
})
