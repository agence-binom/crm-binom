import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr'
import { chromium } from '@playwright/test'

/**
 * L'appli n'a pas de login par mot de passe (OTP uniquement), donc pour obtenir une session de
 * test on rejoue exactement ce que fait le client Supabase de l'appli (@supabase/ssr, cookies
 * chunkées en base64url) via un signInWithPassword sur un user seedé localement, puis on
 * construit un storageState Playwright à partir des cookies obtenus.
 *
 * Réutilisé par e2e/global-setup.ts (session interne) et les specs qui ont besoin de plusieurs
 * sessions distinctes (ex. e2e/client-portal-auth.spec.ts).
 */
export const createSessionStorageState = async (
  email: string,
  password: string,
  baseURL: string
) => {
  const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NUXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'NUXT_PUBLIC_SUPABASE_URL et NUXT_PUBLIC_SUPABASE_KEY doivent être définis (voir .env) pour générer une session de test.'
    )
  }

  const cookiePrefix = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
  const cookieOptions: CookieOptionsWithName = { name: cookiePrefix, sameSite: 'lax', secure: true }

  const collectedCookies: { name: string, value: string, options: Record<string, unknown> }[] = []

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll: () => [],
      setAll: (cookiesToSet) => {
        collectedCookies.push(...cookiesToSet)
      }
    }
  })

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(`Connexion du user de test "${email}" impossible : ${error.message}`)
  }

  // applyServerStorage est déclenché de façon async par onAuthStateChange(SIGNED_IN)
  const deadline = Date.now() + 3000
  while (collectedCookies.length === 0 && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  if (collectedCookies.length === 0) {
    throw new Error(
      `Aucun cookie de session généré pour "${email}". Vérifiez que le user existe (supabase/seed.sql) et que le stack Supabase local tourne (supabase start).`
    )
  }

  const { hostname } = new URL(baseURL)

  const browser = await chromium.launch()
  const context = await browser.newContext()

  await context.addCookies(
    collectedCookies.map(({ name, value, options }) => ({
      name,
      value,
      domain: hostname,
      path: (options?.path as string | undefined) ?? '/',
      httpOnly: Boolean(options?.httpOnly),
      // baseURL de test est en http:// (localhost) : un cookie "secure" ne serait
      // jamais renvoyé au serveur, ce qui casserait l'auth côté SSR.
      secure: false,
      sameSite: 'Lax' as const
    }))
  )

  const storageState = await context.storageState()
  await browser.close()

  return storageState
}
