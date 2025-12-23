import { db } from '~/db'
import { users } from '~/db/schema'

export default defineEventHandler(async () => {
  // Récupérer tous les utilisateurs
  const allUsers = await db.select().from(users)

  return {
    users: allUsers
  }
})
