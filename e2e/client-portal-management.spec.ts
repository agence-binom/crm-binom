import { eq } from 'drizzle-orm'
import { test, expect } from '@playwright/test'
import { db } from '../app/db'
import { clientsTable } from '../app/db/schema/clients'
import { contactsTable } from '../app/db/schema/contacts'
import { createSessionStorageState } from './helpers/supabase-session'

/**
 * Seuls les admins peuvent gérer l'accès portail d'un contact (voir issue #101) : un employé
 * authentifié ne doit pas pouvoir inviter ni révoquer, même s'il peut par ailleurs gérer les
 * contacts. Utilise un contact/client dédiés (pas les fixtures jean.dupont/marie.petit du seed,
 * réutilisées par e2e/client-portal-auth.spec.ts) pour ne pas interférer avec leur état.
 */

let clientId: number
let contactId: number

test.beforeAll(async () => {
  const [client] = await db.insert(clientsTable)
    .values({ name: 'Client e2e portail RBAC' })
    .returning({ id: clientsTable.id })
  clientId = client!.id

  const [contact] = await db.insert(contactsTable)
    .values({ clientId, firstName: 'Test', lastName: 'RBAC', email: 'test-portail-rbac@example.test' })
    .returning({ id: contactsTable.id })
  contactId = contact!.id
})

test.afterAll(async () => {
  // Cascade sur le contact (contacts.clientId a onDelete: 'set null', donc on supprime le contact
  // explicitement pour ne pas laisser un contact orphelin derrière la suite).
  await db.delete(contactsTable).where(eq(contactsTable.id, contactId))
  await db.delete(clientsTable).where(eq(clientsTable.id, clientId))
})

test('un employé ne peut pas donner l\'accès portail à un contact', async ({ browser, baseURL }) => {
  const storageState = await createSessionStorageState('employee@crmbinom.test', 'password123', baseURL!)
  const context = await browser.newContext({ storageState })

  const response = await context.request.post(`/api/contacts/${contactId}/portal/invite`)
  expect(response.status()).toBe(403)

  await context.close()
})

test('un employé ne peut pas révoquer l\'accès portail d\'un contact', async ({ browser, baseURL }) => {
  const storageState = await createSessionStorageState('employee@crmbinom.test', 'password123', baseURL!)
  const context = await browser.newContext({ storageState })

  const response = await context.request.post(`/api/contacts/${contactId}/portal/revoke`)
  expect(response.status()).toBe(403)

  await context.close()
})

test('un admin peut révoquer l\'accès portail d\'un contact', async ({ page }) => {
  // Session admin par défaut (voir e2e/global-setup.ts et playwright.config.ts).
  const response = await page.request.post(`/api/contacts/${contactId}/portal/revoke`)
  expect(response.status()).toBe(200)

  const [updated] = await db.select().from(contactsTable).where(eq(contactsTable.id, contactId))
  expect(updated?.portalStatus).toBe('revoked')
})
