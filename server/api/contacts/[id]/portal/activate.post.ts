import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '~/db/index'
import { contactsTable } from '~/db/schema/contacts'
import { contactIdSchema } from '~/validation/contacts'
import { findConflictingPortalContact, requireContactById } from '../../../../utils/client-portal'
import { canManagePortalAccess } from '../../../../lib/client-portal'
import { logActivity } from '../../../../utils/activity-log'
import { getAppUser } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  if (!canManagePortalAccess(event.context.appUser?.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seuls les administrateurs peuvent gérer l’accès portail d’un contact'
    })
  }

  const { id } = await getValidatedRouterParams(event, contactIdSchema.parse)

  const contact = await requireContactById(id)

  if (contact.archived) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Impossible de donner un accès portail à un contact archivé'
    })
  }

  if (!contact.email) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Un email est requis pour donner accès au portail'
    })
  }

  if (!contact.clientId) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Le contact doit être rattaché à un client pour accéder au portail'
    })
  }

  const conflict = await findConflictingPortalContact(contact.email, contact.id)
  if (conflict) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Un autre contact utilise déjà cet email pour l’accès portail'
    })
  }

  // Active uniquement le statut : aucun mail n'est envoyé ici, c'est le rôle de l'action
  // "Envoyer le mail" (endpoint invite) déclenchée explicitement par l'admin.
  const [updatedContact] = await db
    .update(contactsTable)
    .set({ portalStatus: 'active', updatedBy: getAppUser(event).id, updatedAt: new Date() })
    .where(eq(contactsTable.id, id))
    .returning()

  void logActivity(event, {
    entityType: 'contact',
    entityId: id,
    action: 'update',
    metadata: { name: `${updatedContact!.firstName} ${updatedContact!.lastName}`, portalStatus: 'active' }
  })

  return {
    message: 'Accès portail activé',
    contact: updatedContact
  }
})
