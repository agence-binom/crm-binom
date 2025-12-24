import { db } from '~/db/index'
import { contactsTable } from '~/db/schema/index'
import { eq } from 'drizzle-orm'
import { contactUpdateSchema, contactIdSchema } from '~/validation/contacts'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, contactIdSchema.parse)
  const body = await readValidatedBody(event, contactUpdateSchema.parse)

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

  const contactUpdated = await db
    .update(contactsTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(contactsTable.id, id))
    .returning()

  return {
    message: 'Contact modifié',
    contact: contactUpdated[0]
  }
})
