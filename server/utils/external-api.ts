import { createError, getRequestHeader, type H3Event } from 'h3'
import { extractBearerToken, isExternalApiSecretConfigured, isValidExternalApiSecret } from '../lib/external-api'

export const requireExternalApiSecret = (event: H3Event) => {
  const expected = useRuntimeConfig(event).briefApiSecret as string | undefined

  if (!isExternalApiSecretConfigured(expected)) {
    console.error('NUXT_BRIEF_API_SECRET absent ou trop court : /api/external/* reste fermé')
    throw createError({
      statusCode: 503,
      statusMessage: 'Service indisponible'
    })
  }

  const provided = extractBearerToken(getRequestHeader(event, 'authorization'))
  if (!isValidExternalApiSecret(provided, expected)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
}
