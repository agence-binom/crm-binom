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

  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, parseInt(id)))

  if (existingUser.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Utilisateur non trouvé'
    })
  }

  await db
    .delete(usersTable)
    .where(eq(usersTable.id, parseInt(id)))

  setResponseStatus(event, 204)
  return null
})
