import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '~/db/index'
import { contactsTable } from '~/db/schema/contacts'
import { contactIdSchema } from '~/validation/contacts'
import { requireContactById } from '../../../../utils/client-portal'
import { canManagePortalAccess } from '../../../../lib/client-portal'

export default defineEventHandler(async (event) => {
  if (!canManagePortalAccess(event.context.appUser?.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seuls les administrateurs peuvent gérer l’accès portail d’un contact'
    })
  }

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
