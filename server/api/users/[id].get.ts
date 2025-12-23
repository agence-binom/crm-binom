import { db } from '~/db/index'
import { usersTable } from '~/db/schema/index'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID manquant'
    })
  }

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

  return {
    user: user[0]
  }
})
