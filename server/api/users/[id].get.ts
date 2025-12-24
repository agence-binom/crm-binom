import { db } from '~/db/index'
import { usersTable } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { userIdSchema } from '~/validation/users'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, userIdSchema.parse)

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

  return {
    user: user[0]
  }
})
