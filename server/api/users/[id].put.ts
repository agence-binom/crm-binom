import { db } from '~/db/index'
import { usersTable } from '~/db/schema/index'
import { eq } from 'drizzle-orm'
import { userUpdateSchema } from '~/db/schema/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID manquant'
    })
  }

  const body = await readValidatedBody(event, userUpdateSchema.parse)

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, parseInt(id)))

  if (user.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Utilisateur non trouvé'
    })
  }

  const userUpdated = await db
    .update(usersTable)
    .set(body)
    .where(eq(usersTable.id, parseInt(id)))
    .returning()

  return {
    message: 'Utilisateur modifié',
    user: userUpdated[0]
  }
})
