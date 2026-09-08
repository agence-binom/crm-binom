import { db } from '~/db/index'
import { usersTable } from '~/db/schema/users'
import { userCreateSchema } from '~/validation/users'
import { logActivity } from '~~/server/utils/activity-log'

export default defineEventHandler(async (event) => {
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
