import { db } from '~/db/index'
import { usersTable } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { userQuerySchema } from '~/db/schema/validation'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, userQuerySchema.parse)

  if (query.email) {
    const user = await db.select().from(usersTable).where(eq(usersTable.email, query.email))
    return { users: user }
  }
  const allUsers = await db.select().from(usersTable)

  return {
    users: allUsers
  }
})
