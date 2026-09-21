import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { test, expect } from '@playwright/test'
import { db } from '../app/db'
import { usersTable } from '../app/db/schema/users'
import { createSessionStorageState } from './helpers/better-auth-session'

/**
 * Seuls les admins peuvent créer/modifier/supprimer un utilisateur staff : un employé authentifié
 * ne doit pas pouvoir s'auto-élever en admin ni gérer les comptes d'accès à l'app, même logique
 * que e2e/client-portal-management.spec.ts pour l'accès portail. Utilise des utilisateurs de test
 * dédiés (pas les fixtures du seed) pour ne pas interférer avec le reste de la suite.
 *
 * usersTable.email est unique globalement (contrairement à contactsTable.email, unique seulement
 * pour un accès portail actif) - ce fichier tourne une fois par projet Playwright (chromium,
 * firefox, webkit) avec son propre beforeAll, donc un email fixe entrerait en conflit entre
 * projets exécutés en parallèle. D'où le suffixe aléatoire.
 */

let targetUserId: number

test.beforeAll(async () => {
  const [user] = await db.insert(usersTable)
    .values({ name: 'Test RBAC Users', email: `test-users-rbac-${randomUUID()}@example.test`, role: 'employee' })
    .returning({ id: usersTable.id })
  targetUserId = user!.id
})

test.afterAll(async () => {
  await db.delete(usersTable).where(eq(usersTable.id, targetUserId))
})

test('un employé ne peut pas créer un utilisateur', async ({ browser, baseURL }) => {
  const storageState = await createSessionStorageState('employee@crmbinom.test', 'password123', baseURL!)
  const context = await browser.newContext({ storageState })

  const response = await context.request.post('/api/users', {
    data: { name: 'Intrus', email: 'intrus-rbac@example.test', role: 'employee' }
  })
  expect(response.status()).toBe(403)

  await context.close()
})

test('un employé ne peut pas modifier un utilisateur', async ({ browser, baseURL }) => {
  const storageState = await createSessionStorageState('employee@crmbinom.test', 'password123', baseURL!)
  const context = await browser.newContext({ storageState })

  const response = await context.request.put(`/api/users/${targetUserId}`, {
    data: { role: 'admin' }
  })
  expect(response.status()).toBe(403)

  await context.close()
})

test('un employé ne peut pas supprimer un utilisateur', async ({ browser, baseURL }) => {
  const storageState = await createSessionStorageState('employee@crmbinom.test', 'password123', baseURL!)
  const context = await browser.newContext({ storageState })

  const response = await context.request.delete(`/api/users/${targetUserId}`)
  expect(response.status()).toBe(403)

  await context.close()
})

test('un admin peut modifier un utilisateur', async ({ page }) => {
  // Session admin par défaut (voir e2e/global-setup.ts et playwright.config.ts).
  const response = await page.request.put(`/api/users/${targetUserId}`, {
    data: { name: 'Test RBAC Users (modifié)' }
  })
  expect(response.status()).toBe(200)
})

test('un admin peut créer puis supprimer un utilisateur', async ({ page }) => {
  const createResponse = await page.request.post('/api/users', {
    data: { name: 'Créé par admin', email: `cree-par-admin-rbac-${randomUUID()}@example.test`, role: 'employee' }
  })
  expect(createResponse.status()).toBe(200)
  const { user } = await createResponse.json()

  const deleteResponse = await page.request.delete(`/api/users/${user.id}`)
  expect(deleteResponse.status()).toBe(204)
})
