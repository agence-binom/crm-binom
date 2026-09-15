import { createError, type H3Event } from 'h3'
import { eq, sql } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { db } from '~/db'
import { usersTable } from '~/db/schema/users'
import { authSessionTable, authUserTable } from '~/db/schema/auth'
import { normalizeEmailAddress } from '../lib/auth-users'
import { auth } from '../lib/better-auth'

const UNAUTHORIZED_LOGIN_MESSAGE = 'Cette adresse email n’est pas autorisée à accéder à l’application.'

// `middleware/01-auth.ts` sets this on every /api/* request outside /api/portal/* - centralized
// here so the non-null cast isn't repeated at every endpoint (même principe que getPortalClient).
export const getAppUser = (event: H3Event) => (
  event.context.appUser as InferSelectModel<typeof usersTable>
)

// Better Auth gère lui-même l'autorisation de ses propres routes (/api/auth/*, catch-all inclus :
// sign-in/sign-out/get-session/magic-link ne peuvent pas exiger d'être déjà connecté, c'est
// justement le mécanisme de connexion). /api/health n'a pas besoin de session, un health check ne
// doit pas dépendre de l'auth pour répondre.
export const isPublicAuthApiPath = (path: string) => path.startsWith('/api/auth/') || path === '/api/health'

export const requireBetterAuthSession = async (event: H3Event) => {
  const session = await auth.api.getSession({ headers: event.headers })

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return session
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

// Une révocation/suppression d'accès (portail ou staff) ne coupe l'accès qu'à partir de la
// prochaine vérification (middleware/01-auth.ts, /api/portal/session) - le cookie de session
// Better Auth reste valide jusqu'à son expiration si on ne supprime pas la ligne ici. Appelé par
// contacts/[id]/portal/revoke.post.ts et users/[id].delete.ts.
export const revokeSessionsForAuthUserId = async (authUserId: string | null) => {
  if (!authUserId) return

  await db.delete(authSessionTable).where(eq(authSessionTable.userId, authUserId))
}

export const revokeSessionsForEmail = async (email: string) => {
  const normalizedEmail = normalizeEmailAddress(email)
  const [authUser] = await db
    .select({ id: authUserTable.id })
    .from(authUserTable)
    .where(sql`lower(${authUserTable.email}) = ${normalizedEmail}`)
    .limit(1)

  await revokeSessionsForAuthUserId(authUser?.id ?? null)
}
