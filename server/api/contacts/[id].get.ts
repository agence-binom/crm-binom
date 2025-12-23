import { db } from '~/db/index'
import { contactsTable } from '~/db/schema/index'
import { eq } from 'drizzle-orm'
import { contactIdSchema } from '~/db/schema/validation'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, contactIdSchema.parse)

  const contact = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.id, id))

  if (contact.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Contact non trouvé'
    })
  }

  return {
    contact: contact[0]
  }
})
