import { test, expect, type Page } from '@playwright/test'

// Ces tests démarrent sans session (pas de storageState), voir playwright.config.ts.
test.use({ storageState: { cookies: [], origins: [] } })

// En dev, un clic trop précoce est intercepté par le <form method="post"> natif
// avant que Vue n'ait attaché ses listeners (soumission native + reload de page).
// On attend la fin de l'hydratation avant d'interagir.
const gotoLogin = async (page: Page) => {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
}

test('un visiteur non connecté est redirigé vers /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/login')
})

test('le formulaire de login affiche une erreur de validation sur un email invalide', async ({ page }) => {
  await gotoLogin(page)

  await page.getByPlaceholder('email@example.com').fill('pas-un-email')
  await page.getByRole('button', { name: 'Se connecter' }).click()

  await expect(page.getByText('Veuillez saisir une adresse email valide.')).toBeVisible()
  await expect(page).toHaveURL('/login')
})

test('une adresse email non autorisée reçoit le même message générique qu\'une adresse valide', async ({ page }) => {
  await gotoLogin(page)

  await page.getByPlaceholder('email@example.com').fill('inconnu@example.com')
  await page.getByRole('button', { name: 'Se connecter' }).click()

  await expect(page.getByText('Lien envoyé', { exact: true })).toBeVisible()
})
