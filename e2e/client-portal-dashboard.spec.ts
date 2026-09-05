import { test, expect } from '@playwright/test'
import { createSessionStorageState } from './helpers/supabase-session'

// Contexte dédié (contact actif jean.dupont), voir e2e/client-portal-auth.spec.ts. Ce contact a
// deux projets seedés (supabase/seed.sql) : "Identité visuelle" et "Refonte site vitrine".
test.use({ storageState: { cookies: [], origins: [] } })

test('un contact actif voit les sections de son projet avec leurs états vides', async ({ browser, baseURL }) => {
  const storageState = await createSessionStorageState(
    'jean.dupont@atelier-dupont.fr',
    'password123',
    baseURL!
  )
  const context = await browser.newContext({ storageState })
  const page = await context.newPage()

  // Un clic trop précoce est ignoré tant que Vue n'a pas attaché ses listeners (voir
  // e2e/auth.spec.ts) : on attend la fin de l'hydratation avant d'interagir.
  await page.goto('/espace-client')
  await page.waitForLoadState('networkidle')

  await expect(page.getByRole('heading', { name: 'Livrables' })).toBeVisible()
  await expect(page.getByText('Aucun livrable pour le moment')).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Documents importants' })).toBeVisible()
  await expect(page.getByText('Aucun document pour le moment')).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Ressources' })).toBeVisible()
  await expect(page.getByText('Aucune ressource pour le moment')).toBeVisible()

  await page.getByRole('button', { name: 'Nouvelle ressource' }).click()
  await expect(page.getByText('Type de ressource')).toBeVisible()

  await context.close()
})

test('un contact actif peut naviguer entre ses projets depuis l\'aside', async ({ browser, baseURL }) => {
  const storageState = await createSessionStorageState(
    'jean.dupont@atelier-dupont.fr',
    'password123',
    baseURL!
  )
  const context = await browser.newContext({ storageState })
  const page = await context.newPage()

  await page.goto('/espace-client')
  await expect(page.getByRole('heading', { name: 'Identité visuelle' })).toBeVisible()

  await page.getByRole('link', { name: 'Refonte site vitrine' }).click()
  await expect(page).toHaveURL(/\/espace-client\/projets\/\d+/)
  await expect(page.getByRole('heading', { name: 'Refonte site vitrine' })).toBeVisible()

  await context.close()
})

test('un contact actif peut ouvrir et fermer la modale de contact de l\'agence', async ({ browser, baseURL }) => {
  const storageState = await createSessionStorageState(
    'jean.dupont@atelier-dupont.fr',
    'password123',
    baseURL!
  )
  const context = await browser.newContext({ storageState })
  const page = await context.newPage()

  // Un clic trop précoce est ignoré tant que Vue n'a pas attaché ses listeners (voir
  // e2e/auth.spec.ts) : on attend la fin de l'hydratation avant d'interagir.
  await page.goto('/espace-client')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Contacter binōm' }).click()
  await expect(page.getByRole('link', { name: 'contact@agence-binom.fr' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'agence-binom.fr', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Fermer' }).click()
  await expect(page.getByRole('link', { name: 'contact@agence-binom.fr' })).toBeHidden()

  await context.close()
})

test('un contact actif peut se déconnecter depuis le menu utilisateur', async ({ browser, baseURL }) => {
  const storageState = await createSessionStorageState(
    'jean.dupont@atelier-dupont.fr',
    'password123',
    baseURL!
  )
  const context = await browser.newContext({ storageState })
  const page = await context.newPage()

  await page.goto('/espace-client')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Menu utilisateur' }).click()
  await expect(page.getByText('Jean Dupont')).toBeVisible()
  await page.getByRole('menuitem', { name: 'Déconnexion' }).click()
  await expect(page).toHaveURL('/login')

  await context.close()
})
