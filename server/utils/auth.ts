import { createError } from 'h3'
import { sql } from 'drizzle-orm'
import { db } from '~/db'
import { usersTable } from '~/db/schema/users'
import { normalizeEmailAddress } from '../lib/auth-users'

const UNAUTHORIZED_LOGIN_MESSAGE = 'Cette adresse email n’est pas autorisée à accéder à l’application.'

export const PUBLIC_AUTH_API_PATHS = ['/api/auth/authorize-email']

export const findAuthorizedAppUserByEmail = async (email: string) => {
  const normalizedEmail = normalizeEmailAddress(email)
  const [user] = await db
    .select()
    .from(usersTable)
    .where(sql`lower(${usersTable.email}) = ${normalizedEmail}`)
    .limit(1)

  return user ?? null
}

export const requireAuthorizedAppUserByEmail = async (email?: string | null) => {
  if (!email) {
    throw createError({
      statusCode: 403,
      statusMessage: UNAUTHORIZED_LOGIN_MESSAGE
    })
  }

  const appUser = await findAuthorizedAppUserByEmail(email)
  if (!appUser) {
    throw createError({
      statusCode: 403,
      statusMessage: UNAUTHORIZED_LOGIN_MESSAGE
    })
  }

  return appUser
}
