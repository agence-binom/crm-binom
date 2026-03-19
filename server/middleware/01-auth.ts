import { createError, getRequestURL } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { PUBLIC_AUTH_API_PATHS, requireAuthorizedAppUserByEmail } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api')) return
  if (PUBLIC_AUTH_API_PATHS.includes(path)) return

  const userSession = await serverSupabaseUser(event)
  if (!userSession) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  await requireAuthorizedAppUserByEmail(userSession.email)
})
