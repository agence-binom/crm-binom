import { db } from '~/db/index'
import { usersTable } from '~/db/schema/users'
import { userCreateSchema } from '~/validation/users'
import { logActivity } from '~~/server/utils/activity-log'
import { canManageUsers } from '~~/server/lib/users'

export default defineEventHandler(async (event) => {
  if (!canManageUsers(event.context.appUser?.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seuls les administrateurs peuvent créer un utilisateur'
    })
  }

  const body = await readValidatedBody(event, userCreateSchema.parse)

  const newUser = await db
    .insert(usersTable)
    .values(body)
    .returning()

  void logActivity(event, { entityType: 'user', entityId: newUser[0]!.id, action: 'create', metadata: { name: newUser[0]!.name } })

  return {
    message: 'Utilisateur créé',
    user: newUser[0]
  }
})
