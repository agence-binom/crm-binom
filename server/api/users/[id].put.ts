import { db } from '~/db/index'
import { usersTable } from '~/db/schema/users'
import { eq } from 'drizzle-orm'
import { userUpdateSchema, userIdSchema } from '~/validation/users'
import { logActivity } from '~~/server/utils/activity-log'
import { canManageUsers } from '~~/server/lib/users'
import { wouldRemoveLastAdmin } from '~~/server/utils/users'

export default defineEventHandler(async (event) => {
  if (!canManageUsers(event.context.appUser?.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seuls les administrateurs peuvent modifier un utilisateur'
    })
  }

  const { id } = await getValidatedRouterParams(event, userIdSchema.parse)

  const body = await readValidatedBody(event, userUpdateSchema.parse)

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))

  if (user.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Utilisateur non trouvé'
    })
  }

  // Ne bloque que la rétrogradation effective du dernier admin, pas les autres modifications de
  // celui-ci (nom, email) - voir wouldRemoveLastAdmin.
  if (body.role && body.role !== user[0]!.role && await wouldRemoveLastAdmin(user[0]!)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Impossible de retirer le rôle admin au dernier administrateur restant'
    })
  }

  const userUpdated = await db
    .update(usersTable)
    .set(body)
    .where(eq(usersTable.id, id))
    .returning()

  void logActivity(event, { entityType: 'user', entityId: id, action: 'update', metadata: { name: userUpdated[0]!.name } })

  return {
    message: 'Utilisateur modifié',
    user: userUpdated[0]
  }
})
