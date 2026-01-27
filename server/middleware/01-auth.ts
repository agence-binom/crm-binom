import { createError, getRequestURL } from 'h3'
import { serverSupabaseSession } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api')) return

  const session = await serverSupabaseSession(event)
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
})
