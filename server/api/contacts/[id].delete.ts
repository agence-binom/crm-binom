import { db } from '~/db/index'
import { contactsTable } from '~/db/schema/index'
import { eq } from 'drizzle-orm'
import { contactIdSchema } from '~/db/schema/validation'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, contactIdSchema.parse)

  const existingContact = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.id, id))

  if (existingContact.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Contact non trouvé'
    })
  }

  await db
    .delete(contactsTable)
    .where(eq(contactsTable.id, id))

  setResponseStatus(event, 204)
  return null
})
