import { db } from '~/db/index'
import { contactsTable } from '~/db/schema/contacts'
import { eq } from 'drizzle-orm'
import { contactIdSchema } from '~/validation/contacts'

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

  if (!existingContact[0]!.archived) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Archivez le contact avant de le supprimer définitivement'
    })
  }

  await db
    .delete(contactsTable)
    .where(eq(contactsTable.id, id))

  setResponseStatus(event, 204)
  return null
})
