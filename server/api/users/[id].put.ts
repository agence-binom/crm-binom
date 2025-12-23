import { db } from '~/db/index'
import { usersTable } from '~/db/schema/index'
import { eq } from 'drizzle-orm'
import { userUpdateSchema, userIdSchema } from '~/db/schema/validation'

export default defineEventHandler(async (event) => {
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

  const userUpdated = await db
    .update(usersTable)
    .set(body)
    .where(eq(usersTable.id, id))
    .returning()

  return {
    message: 'Utilisateur modifié',
    user: userUpdated[0]
  }
})
