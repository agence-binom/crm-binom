import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { findAuthorizedAppUserByAuthUserId, findAuthorizedAppUserByEmail, requireSupabaseUser } from '../../utils/auth'
import { db } from '~/db'
import { usersTable } from '~/db/schema/users'

const UNAUTHORIZED_LOGIN_MESSAGE = 'Cette adresse email n\'est pas autorisée à accéder à l\'application.'

export default defineEventHandler(async (event) => {
  const userSession = await requireSupabaseUser(event)

  const authUserId: string | undefined = userSession.id ?? (userSession as Record<string, unknown>).sub as string | undefined

  let user = authUserId
    ? await findAuthorizedAppUserByAuthUserId(authUserId)
    : null

  if (!user && userSession.email) {
    user = await findAuthorizedAppUserByEmail(userSession.email)

    if (user && authUserId) {
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
