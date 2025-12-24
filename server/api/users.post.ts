import { db } from '~/db/index'
import { usersTable } from '~/db/schema'
import { userCreateSchema } from '~/validation/users'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, userCreateSchema.parse)

  const newUser = await db
    .insert(usersTable)
    .values(body)
    .returning()

  return {
    message: 'Utilisateur créé',
    user: newUser[0]
  }
})
