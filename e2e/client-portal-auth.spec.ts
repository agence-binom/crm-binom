import { test, expect } from '@playwright/test'
import { createSessionStorageState } from './helpers/supabase-session'

// Ces tests créent leurs propres contextes/sessions Supabase (contact actif, contact révoqué),
// distinctes de la session interne par défaut (voir playwright.config.ts) : ils n'utilisent donc
// pas le storageState de page par défaut.
test.use({ storageState: { cookies: [], origins: [] } })

test('un contact avec un accès portail actif accède a son espace client', async ({ browser, baseURL }) => {
  const storageState = await createSessionStorageState(
    'jean.dupont@atelier-dupont.fr',
    'password123',
    baseURL!
  )
  const context = await browser.newContext({ storageState })
  const page = await context.newPage()

  // /espace-client redirige vers le premier projet du client (voir app/pages/espace-client/index.vue).
  await page.goto('/espace-client')
  await expect(page).toHaveURL(/\/espace-client\/projets\/\d+/)
  await expect(page.getByRole('heading', { name: 'Identité visuelle' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Refonte site vitrine' })).toBeVisible()

  await context.close()
})

test('un contact dont l\'accès portail est révoqué est redirigé vers /login', async ({ browser, baseURL }) => {
  const storageState = await createSessionStorageState(
    'marie.petit@atelier-dupont.fr',
    'password123',
    baseURL!
  )
  const context = await browser.newContext({ storageState })
  const page = await context.newPage()

  await page.goto('/espace-client')
  await expect(page).toHaveURL('/login')

  await context.close()
})

test('un contact actif ne peut pas accéder aux pages internes', async ({ browser, baseURL }) => {
  const storageState = await createSessionStorageState(
    'jean.dupont@atelier-dupont.fr',
    'password123',
    baseURL!
  )
  const context = await browser.newContext({ storageState })
  const page = await context.newPage()

  await page.goto('/clients')
  await expect(page).toHaveURL(/\/espace-client/)

  await context.close()
})
