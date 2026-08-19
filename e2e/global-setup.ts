import 'dotenv/config'
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr'
import { chromium, type FullConfig } from '@playwright/test'

const STORAGE_STATE_PATH = 'playwright/.auth/user.json'
const TEST_USER_EMAIL = process.env.PLAYWRIGHT_TEST_USER_EMAIL ?? 'admin@crmbinom.test'
const TEST_USER_PASSWORD = process.env.PLAYWRIGHT_TEST_USER_PASSWORD ?? 'password123'

/**
 * L'appli n'a pas de login par mot de passe (OTP uniquement), donc pour obtenir
 * une session de test on rejoue exactement ce que fait le client Supabase de
 * l'appli (@supabase/ssr, cookies chunkées en base64url) via un signInWithPassword
 * sur le user seedé localement, puis on injecte les cookies obtenus dans le
 * navigateur avant les tests.
 */
export default async function globalSetup(config: FullConfig) {
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

  const { error } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD
  })

  if (error) {
    throw new Error(`Connexion du user de test "${TEST_USER_EMAIL}" impossible : ${error.message}`)
  }

  // applyServerStorage est déclenché de façon async par onAuthStateChange(SIGNED_IN)
  const deadline = Date.now() + 3000
  while (collectedCookies.length === 0 && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  if (collectedCookies.length === 0) {
    throw new Error(
      `Aucun cookie de session généré pour "${TEST_USER_EMAIL}". Vérifiez que le user existe (supabase/seed.sql) et que le stack Supabase local tourne (supabase start).`
    )
  }

  const baseURL = config.projects[0]?.use?.baseURL as string | undefined ?? 'http://localhost:3000'
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

  await context.storageState({ path: STORAGE_STATE_PATH })
  await browser.close()
}
