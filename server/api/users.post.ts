import { db } from '~/db/index'
import { usersTable } from '~/db/schema/index'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name || !body.email || !body.age) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nom, email et âge requis'
    })
  }

  const newUser = await db
    .insert(usersTable)
    .values({
      name: body.name,
      email: body.email,
      age: body.age
    })
    .returning()

  return {
    message: 'Utilisateur créé',
    user: newUser[0]
  }
})
