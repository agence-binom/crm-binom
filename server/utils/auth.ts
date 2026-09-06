import { createError, type H3Event } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { serverSupabaseUser } from '#supabase/server'
import { db } from '~/db'
import { usersTable } from '~/db/schema/users'
import { normalizeEmailAddress } from '../lib/auth-users'

const UNAUTHORIZED_LOGIN_MESSAGE = 'Cette adresse email n’est pas autorisée à accéder à l’application.'

export const PUBLIC_AUTH_API_PATHS = ['/api/auth/authorize-email']

export const requireSupabaseUser = async (event: H3Event) => {
  const userSession = await serverSupabaseUser(event)

  if (!userSession) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return userSession
}

export const findAuthorizedAppUserByAuthUserId = async (authUserId: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.authUserId, authUserId))
    .limit(1)

  return user ?? null
}

export const requireAuthorizedAppUserByAuthUserId = async (authUserId?: string | null) => {
  if (!authUserId) {
    throw createError({
      statusCode: 403,
      statusMessage: UNAUTHORIZED_LOGIN_MESSAGE
    })
  }

  const appUser = await findAuthorizedAppUserByAuthUserId(authUserId)
  if (!appUser) {
    throw createError({
      statusCode: 403,
      statusMessage: UNAUTHORIZED_LOGIN_MESSAGE
    })
  }

  return appUser
}

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
