import { createError } from 'h3'

type DatabaseErrorLike = {
  code?: string
  hostname?: string
}

const SUPABASE_DIRECT_HOST_PATTERN = /^db\.[a-z0-9-]+\.supabase\.co$/i

const isDatabaseErrorLike = (error: unknown): error is DatabaseErrorLike => (
  typeof error === 'object'
  && error !== null
)

export const toPublicDatabaseError = (error: unknown) => {
  if (!isDatabaseErrorLike(error)) {
    return error
  }

  if (
    error.code === 'ENOTFOUND'
    && typeof error.hostname === 'string'
    && SUPABASE_DIRECT_HOST_PATTERN.test(error.hostname)
  ) {
    return createError({
      statusCode: 503,
      statusMessage: 'Connexion a la base indisponible. DATABASE_URL utilise probablement l hote direct Supabase, qui requiert IPv6. Remplacez-la par l URL Session pooler depuis Supabase > Connect.'
    })
  }

  return error
}
