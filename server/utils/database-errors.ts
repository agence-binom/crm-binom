import { createError } from 'h3'

type DatabaseErrorLike = {
  code?: string
}

// Une base injoignable remonte sinon en 500 opaque, impossible à distinguer d'un bug applicatif.
// Le message reste volontairement générique : il ne doit jamais contenir l'hôte, le port ou le rôle
// réels, qui sont des détails d'infra à ne pas exposer dans une réponse HTTP.
const UNREACHABLE_DATABASE_CODES = new Set(['ENOTFOUND', 'ECONNREFUSED'])

const isDatabaseErrorLike = (error: unknown): error is DatabaseErrorLike => (
  typeof error === 'object'
  && error !== null
)

export const toPublicDatabaseError = (error: unknown) => {
  if (!isDatabaseErrorLike(error)) {
    return error
  }

  if (typeof error.code === 'string' && UNREACHABLE_DATABASE_CODES.has(error.code)) {
    return createError({
      statusCode: 503,
      statusMessage: 'Base de données injoignable. Vérifiez que la base est démarrée et que DATABASE_URL est correcte.'
    })
  }

  return error
}
