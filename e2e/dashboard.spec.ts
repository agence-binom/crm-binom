import { test, expect } from '@playwright/test'

test('un user authentifié accède au tableau de bord sans passer par /login', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
})
