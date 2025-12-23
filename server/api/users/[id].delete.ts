import { db } from '~/db/index'
import { usersTable } from '~/db/schema/index'
import { eq } from 'drizzle-orm'
import { userIdSchema } from '~/db/schema/validation'

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
