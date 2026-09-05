import { eq } from 'drizzle-orm'
import { db } from '~/db/index'
import { contactsTable } from '~/db/schema/contacts'
import { contactIdSchema } from '~/validation/contacts'
import { requireContactById } from '../../../../utils/client-portal'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, contactIdSchema.parse)

  await requireContactById(id)

  const [updatedContact] = await db
    .update(contactsTable)
    .set({ portalStatus: 'revoked', updatedAt: new Date() })
    .where(eq(contactsTable.id, id))
    .returning()

  return {
    message: 'Accès portail révoqué',
    contact: updatedContact
  }
})
