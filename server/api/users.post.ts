import { db } from '~/db/index'
import { usersTable } from '~/db/schema/index'
import { userCreateSchema } from '~/db/schema/validation'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, userCreateSchema.parse)

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
