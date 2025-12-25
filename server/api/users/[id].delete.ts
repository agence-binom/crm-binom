import { db } from '~/db/index'
import { usersTable } from '~/db/schema/users'
import { eq } from 'drizzle-orm'
import { userIdSchema } from '~/validation/users'

export default defineEventHandler(async (event) => {
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

  await db
    .delete(usersTable)
    .where(eq(usersTable.id, id))

  setResponseStatus(event, 204)
  return null
})
