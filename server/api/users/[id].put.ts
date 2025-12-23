import { db } from '~/db/index'
import { usersTable } from '~/db/schema/index'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

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

  if (!body.name || !body.email || !body.age) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nom, email et âge requis'
    })
  }

  const userUpdated = await db
    .update(usersTable)
    .set({
      name: body.name,
      email: body.email,
      age: body.age
    })
    .where(eq(usersTable.id, parseInt(id)))
    .returning()

  return {
    message: 'Utilisateur modifié',
    user: userUpdated[0]
  }
})
