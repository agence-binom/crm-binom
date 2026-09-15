import { db } from '~/db/index'
import { usersTable } from '~/db/schema/users'
import { eq } from 'drizzle-orm'
import { userIdSchema } from '~/validation/users'
import { logActivity } from '~~/server/utils/activity-log'
import { canManageUsers } from '~~/server/lib/users'
import { wouldRemoveLastAdmin } from '~~/server/utils/users'
import { revokeSessionsForAuthUserId } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  if (!canManageUsers(event.context.appUser?.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seuls les administrateurs peuvent supprimer un utilisateur'
    })
  }

  const { id } = await getValidatedRouterParams(event, userIdSchema.parse)

  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))

  if (existingUser.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Utilisateur non trouvé'
    })
  }

  if (await wouldRemoveLastAdmin(existingUser[0]!)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Impossible de supprimer le dernier administrateur restant'
    })
  }

  // Journalisé avant la suppression, et attendu (contrairement aux autres appels à logActivity) :
  // un admin peut supprimer son propre compte, auquel cas l'acteur (appUser) n'existerait plus pour
  // la contrainte de clé étrangère si l'écriture n'était pas garantie avant le DELETE ci-dessous.
  await logActivity(event, { entityType: 'user', entityId: id, action: 'delete', metadata: { name: existingUser[0]!.name } })

  // Coupe aussi les sessions actives : sans ça, un compte déjà connecté garderait l'accès jusqu'à
  // l'expiration de son cookie malgré la suppression de son compte staff.
  await revokeSessionsForAuthUserId(existingUser[0]!.authUserId)

  await db
    .delete(usersTable)
    .where(eq(usersTable.id, id))

  setResponseStatus(event, 204)
  return null
})
