import { db } from '~/db/index'
import { contactsTable } from '~/db/schema/contacts'
import { eq } from 'drizzle-orm'
import { contactUpdateSchema, contactIdSchema } from '~/validation/contacts'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

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
    .set({ ...body, updatedBy: getAppUser(event).id, updatedAt: new Date() })
    .where(eq(contactsTable.id, id))
    .returning()

  void logActivity(event, { entityType: 'contact', entityId: id, action: 'update', metadata: { name: `${contactUpdated[0]!.firstName} ${contactUpdated[0]!.lastName}` } })

  return {
    message: 'Contact modifié',
    contact: contactUpdated[0]
  }
})
