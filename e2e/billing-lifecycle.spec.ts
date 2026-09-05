import { eq } from 'drizzle-orm'
import { test, expect } from '@playwright/test'
import { db } from '../app/db'
import { billingDocumentsTable } from '../app/db/schema/billing-documents'
import { clientsTable } from '../app/db/schema/clients'
import { projectsTable } from '../app/db/schema/projects'

/**
 * Seeds a project where every step is genuinely current and completed (an acompte and a solde
 * invoice both current at once, a superseded older quote, and an isolated avoir that never
 * supersedes/is superseded) and checks two things end to end: the dashboard's status filter
 * (`/api/billing/projects?status=...`, driven by `billingStatus.tone` computed from the cascade)
 * correctly places this project under "success" and nowhere else, and the project detail
 * timeline (driven by `annotateDocumentLifecycle`) renders the same "current" documents.
 */

let clientId: number
let projectId: number

test.beforeAll(async () => {
  const [client] = await db.insert(clientsTable)
    .values({ name: 'Client e2e lifecycle' })
    .returning({ id: clientsTable.id })
  clientId = client!.id

  const [project] = await db.insert(projectsTable)
    .values({ clientId, name: 'Projet e2e lifecycle', requiresAcompte: true })
    .returning({ id: projectsTable.id })
  projectId = project!.id

  await db.insert(billingDocumentsTable).values([
    { projectId, documentType: 'commercial_proposal', status: 'completed', createdAt: new Date('2026-01-01') },
    // Older quote, superseded by the one below.
    { projectId, documentType: 'quote', status: 'completed', externalUrl: 'https://www.facture.net/quote-old', createdAt: new Date('2026-01-02') },
    { projectId, documentType: 'quote', status: 'completed', externalUrl: 'https://www.facture.net/quote-new', createdAt: new Date('2026-01-03') },
    // Acompte and solde must both stay "current" at once - they're not versions of each other.
    { projectId, documentType: 'invoice', subtype: 'acompte', status: 'completed', externalUrl: 'https://www.facture.net/acompte', createdAt: new Date('2026-01-04') },
    { projectId, documentType: 'invoice', subtype: 'solde', status: 'completed', externalUrl: 'https://www.facture.net/solde', createdAt: new Date('2026-01-05') },
    // An "avoir" is its own isolated lifecycle group - it never supersedes/is superseded.
    { projectId, documentType: 'invoice', subtype: 'avoir', status: 'completed', createdAt: new Date('2026-01-06') }
  ])
})

test.afterAll(async () => {
  // Cascades to the project and its billing_documents rows.
  await db.delete(clientsTable).where(eq(clientsTable.id, clientId))
})

test('le filtre de statut du dashboard et le lifecycle de la fiche projet sont cohérents (acompte + solde + avoir)', async ({ page }) => {
  // --- Every step is completed, so `billingStatus.tone` must be 'success' - and nothing else.
  const successResponse = await page.request.get('/api/billing/projects', {
    params: { status: 'success', projectId }
  })
  const success = await successResponse.json()
  expect(success.items.map((item: { project: { id: number } }) => item.project.id)).toContain(projectId)

  const otherToneResponses = await Promise.all(['neutral', 'warning', 'muted'].map(tone =>
    page.request.get('/api/billing/projects', { params: { status: tone, projectId } })
  ))
  for (const response of otherToneResponses) {
    const body = await response.json()
    expect(body.items.map((item: { project: { id: number } }) => item.project.id)).not.toContain(projectId)
  }

  // --- The project detail timeline is driven by `annotateDocumentLifecycle`.
  await page.goto(`/clients/${clientId}/projects/${projectId}`)

  const timeline = page.locator('[data-slot="root"]')
  const titles = timeline.locator('[data-slot="title"]')
  await expect(titles.filter({ hasText: 'Devis' })).toHaveCount(2)
  await expect(titles.filter({ hasText: 'Facture d\'acompte' })).toHaveCount(1)
  await expect(titles.filter({ hasText: 'Facture de solde' })).toHaveCount(1)
  await expect(titles.filter({ hasText: 'Avoir' })).toHaveCount(1)

  // Exactly one item is greyed out (the superseded quote) - acompte, solde and the avoir all
  // stay "current" simultaneously, matching `invoiceCurrentTotal = 2` on the SQL side.
  await expect(timeline.locator('[data-slot="item"].opacity-60')).toHaveCount(1)
})
