import { createError } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { requireAuthorizedAppUserByEmail } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userSession = await serverSupabaseUser(event)

  if (!userSession) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const user = await requireAuthorizedAppUserByEmail(userSession.email)

  return {
    user
  }
})
