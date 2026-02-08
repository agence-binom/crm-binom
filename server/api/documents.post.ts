import { db } from '~/db'
import { documentsTable } from '~/db/schema/documents'
import { documentCreateSchema } from '~/validation/documents'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, documentCreateSchema.parse)
  const [document] = await db.insert(documentsTable).values(body).returning()
  return document
})
