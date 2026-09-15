import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '~/db/index'
import { contactsTable } from '~/db/schema/contacts'
import { contactIdSchema } from '~/validation/contacts'
import { requireContactById } from '../../../../utils/client-portal'
import { canManagePortalAccess } from '../../../../lib/client-portal'
import { logActivity } from '../../../../utils/activity-log'
import { getAppUser, revokeSessionsForEmail } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  if (!canManagePortalAccess(event.context.appUser?.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seuls les administrateurs peuvent gérer l’accès portail d’un contact'
    })
  }

  const { id } = await getValidatedRouterParams(event, contactIdSchema.parse)

  const contact = await requireContactById(id)

  const [updatedContact] = await db
    .update(contactsTable)
    .set({ portalStatus: 'revoked', updatedBy: getAppUser(event).id, updatedAt: new Date() })
    .where(eq(contactsTable.id, id))
    .returning()

  // Coupe aussi la session active du contact : sans ça, un contact déjà connecté garderait
  // l'accès jusqu'à l'expiration de son cookie malgré la révocation.
  if (contact.email) {
    await revokeSessionsForEmail(contact.email)
  }

  void logActivity(event, {
    entityType: 'contact',
    entityId: id,
    action: 'update',
    metadata: { name: `${updatedContact!.firstName} ${updatedContact!.lastName}`, portalStatus: 'revoked' }
  })

  return {
    message: 'Accès portail révoqué',
    contact: updatedContact
  }
})
