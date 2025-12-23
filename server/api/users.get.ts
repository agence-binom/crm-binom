import { db } from '~/db/index'
import { usersTable } from '~/db/schema/index'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const email = query.email as string | undefined

  if (email) {
    // Filtrer par email
    const user = await db.select().from(usersTable).where(eq(usersTable.email, email))
    return { users: user }
  }
  const allUsers = await db.select().from(usersTable)

  return {
    users: allUsers
  }
})
