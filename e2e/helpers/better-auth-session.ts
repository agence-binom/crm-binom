import { chromium } from '@playwright/test'
import { auth } from '../../server/lib/better-auth'

type ParsedCookie = {
  name: string
  value: string
  path: string
  httpOnly: boolean
  secure: boolean
  sameSite: 'Strict' | 'Lax' | 'None'
}

const parseSameSite = (raw: string | undefined): ParsedCookie['sameSite'] => {
  const normalized = raw?.toLowerCase()
  if (normalized === 'strict') return 'Strict'
  if (normalized === 'none') return 'None'
  return 'Lax'
}

const parseSetCookie = (setCookie: string): ParsedCookie => {
  const [pair, ...attributes] = setCookie.split(';').map(part => part.trim())
  const separatorIndex = pair.indexOf('=')
  const name = pair.slice(0, separatorIndex)
  const value = pair.slice(separatorIndex + 1)

  const attributeMap = new Map(
    attributes.map((attribute) => {
      const [key, val] = attribute.split('=')
      return [key.toLowerCase(), val]
    })
  )

  return {
    name,
    value,
    path: attributeMap.get('path') ?? '/',
    httpOnly: attributes.some(attribute => attribute.toLowerCase() === 'httponly'),
    secure: attributes.some(attribute => attribute.toLowerCase() === 'secure'),
    sameSite: parseSameSite(attributeMap.get('samesite'))
  }
}

/**
 * L'appli n'a pas de login par mot de passe dans l'UI réelle (magic-link uniquement), mais Better
 * Auth expose email+password en dev/CI pour ce genre de bootstrap (voir emailAndPassword dans
 * server/lib/better-auth.ts). On appelle directement l'API serveur (pas de round-trip HTTP) et on
 * récupère le cookie de session depuis les headers de la réponse plutôt que de rejouer nous-mêmes
 * le format/nommage du cookie - contrairement à l'ancien helper Supabase, on possède maintenant le
 * serveur d'auth donc plus besoin de le répliquer manuellement.
 *
 * Réutilisé par e2e/global-setup.ts (session interne) et les specs qui ont besoin de plusieurs
 * sessions distinctes (ex. e2e/client-portal-auth.spec.ts).
 */
export const createSessionStorageState = async (
  email: string,
  password: string,
  baseURL: string
) => {
  const { headers } = await auth.api.signInEmail({
    body: { email, password },
    returnHeaders: true
  })

  const setCookieHeaders = headers.getSetCookie()
  if (setCookieHeaders.length === 0) {
    throw new Error(
      `Aucun cookie de session généré pour "${email}". Vérifiez que le user existe (supabase/seed.sql + scripts/seed.ts) et que la base locale est à jour (npm run db:reset:local).`
    )
  }

  const { hostname } = new URL(baseURL)
  const cookies = setCookieHeaders.map(parseSetCookie)

  const browser = await chromium.launch()
  const context = await browser.newContext()

  await context.addCookies(
    cookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: hostname,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite
    }))
  )

  const storageState = await context.storageState()
  await browser.close()

  return storageState
}
