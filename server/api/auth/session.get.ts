import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { findAuthorizedAppUserByAuthUserId, findAuthorizedAppUserByEmail, requireBetterAuthSession } from '../../utils/auth'
import { db } from '~/db'
import { usersTable } from '~/db/schema/users'

const UNAUTHORIZED_LOGIN_MESSAGE = 'Cette adresse email n\'est pas autorisée à accéder à l\'application.'

export default defineEventHandler(async (event) => {
  const session = await requireBetterAuthSession(event)
  const authUserId = session.user.id

  let user = await findAuthorizedAppUserByAuthUserId(authUserId)

  if (!user && session.user.email) {
    user = await findAuthorizedAppUserByEmail(session.user.email)

    if (user) {
      await db
        .update(usersTable)
        .set({ authUserId })
        .where(eq(usersTable.id, user.id))
    }
  }

  if (!user) {
    throw createError({
      statusCode: 403,
      statusMessage: UNAUTHORIZED_LOGIN_MESSAGE
    })
  }

  return {
    user
  }
})
