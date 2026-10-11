import { eq } from 'drizzle-orm'
import { test, expect } from '@playwright/test'
import { db } from '../app/db'
import { billingDocumentsTable } from '../app/db/schema/billing-documents'
import { clientsTable } from '../app/db/schema/clients'
import { projectBriefsTable } from '../app/db/schema/project-briefs'
import { projectsTable } from '../app/db/schema/projects'
import { E2E_BRIEF_SITE_URL, briefApiHeaders } from './helpers/brief-api'
import { createBriefFixtures } from './helpers/brief-fixtures'
import { createSessionStorageState } from './helpers/better-auth-session'

/**
 * Côté staff : envoi (nouveau projet ou projet existant), régénération, suppression, rattachement
 * manuel, et ce que l'avant-vente change ailleurs (portail client, signature du devis).
 */

const fixtures = createBriefFixtures()
test.afterAll(fixtures.cleanup)

const tokenFromUrl = (url: string) => url.split('/brief/')[1]!

test('envoie un brief pour un nouveau projet : aucun projet n’est créé avant la réponse', async ({ request }) => {
  const { clientId, contactId } = await fixtures.createProspect()

  const response = await request.post(`/api/clients/${clientId}/briefs`, { data: { contactId } })
  expect(response.status()).toBe(201)
  const brief = await response.json()

  expect(brief.url).toMatch(new RegExp(`^${E2E_BRIEF_SITE_URL}/brief/[\\w-]{43}$`))
  expect(brief.target).toBe('new_project')
  expect(brief.projectId).toBeNull()
  expect(brief.displayStatus).toBe('sent')
  expect(brief.contactName).toBe('Rose Garnier')
  const validityDays = (new Date(brief.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  expect(validityDays).toBeGreaterThan(29.9)
  expect(validityDays).toBeLessThanOrEqual(30)

  const { briefs } = await (await request.get(`/api/clients/${clientId}/briefs`)).json()
  expect(briefs.map((item: { id: number }) => item.id)).toEqual([brief.id])
  expect(await db.select().from(projectsTable).where(eq(projectsTable.clientId, clientId))).toHaveLength(0)
})

test('envoie un brief pour un projet existant, visible sur la fiche du projet et sa carte', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const project = await fixtures.createProject(clientId)

  const brief = await (await request.post(`/api/clients/${clientId}/briefs`, { data: { projectId: project.id } })).json()
  expect(brief.target).toBe('existing_project')
  expect(brief.projectName).toBe('Projet saisi à la main')

  const projectBrief = await request.get(`/api/projects/${project.id}/brief`)
  expect(projectBrief.status()).toBe(200)
  expect((await projectBrief.json()).id).toBe(brief.id)

  const { projects } = await (await request.get(`/api/clients/${clientId}/dashboard`)).json()
  expect(projects[0].brief).toEqual({ id: brief.id, status: 'sent' })
})

test('un projet a au plus un brief, et seulement un projet du même client', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const other = await fixtures.createProspect('Autre prospect')
  const project = await fixtures.createProject(clientId)
  const otherProject = await fixtures.createProject(other.clientId)

  expect((await request.post(`/api/clients/${clientId}/briefs`, { data: { projectId: project.id } })).status()).toBe(201)
  expect((await request.post(`/api/clients/${clientId}/briefs`, { data: { projectId: project.id } })).status()).toBe(409)
  expect((await request.post(`/api/clients/${clientId}/briefs`, { data: { projectId: otherProject.id } })).status()).toBe(400)
  expect((await request.post(`/api/clients/${clientId}/briefs`, { data: { contactId: other.contactId } })).status()).toBe(400)
})

test('un projet sans brief répond 404 sur son brief', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const project = await fixtures.createProject(clientId)
  expect((await request.get(`/api/projects/${project.id}/brief`)).status()).toBe(404)
})

test('régénérer un lien invalide immédiatement l’ancien, sans créer de second brief', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const created = await (await request.post(`/api/clients/${clientId}/briefs`, { data: {} })).json()
  const oldToken = tokenFromUrl(created.url)

  const response = await request.post(`/api/briefs/${created.id}/regenerate`, { data: { expiresInDays: 10 } })
  expect(response.status()).toBe(200)
  const regenerated = await response.json()
  expect(regenerated.id).toBe(created.id)
  expect(regenerated.url).not.toBe(created.url)

  expect((await request.get(`/api/external/briefs/${oldToken}`, { headers: briefApiHeaders() })).status()).toBe(404)
  expect((await request.get(`/api/external/briefs/${tokenFromUrl(regenerated.url)}`, { headers: briefApiHeaders() })).status()).toBe(200)
  expect(await db.select().from(projectBriefsTable).where(eq(projectBriefsTable.clientId, clientId))).toHaveLength(1)
})

test('un brief complété ne peut pas être régénéré', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const brief = await fixtures.createBrief({ clientId, status: 'completed', completedAt: new Date() })
  expect((await request.post(`/api/briefs/${brief.id}/regenerate`, { data: {} })).status()).toBe(409)
})

test('supprime un brief en attente', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const created = await (await request.post(`/api/clients/${clientId}/briefs`, { data: {} })).json()

  expect((await request.delete(`/api/briefs/${created.id}`)).status()).toBe(204)
  expect((await request.get(`/api/briefs/${created.id}`)).status()).toBe(404)
  expect((await request.get(`/api/external/briefs/${tokenFromUrl(created.url)}`, { headers: briefApiHeaders() })).status()).toBe(404)
})

test('supprimer un projet supprime son brief', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const project = await fixtures.createProject(clientId, { archived: true })
  const brief = await fixtures.createBrief({ clientId, projectId: project.id, target: 'existing_project' })

  expect((await request.delete(`/api/projects/${project.id}`)).status()).toBe(204)
  expect((await request.get(`/api/briefs/${brief.id}`)).status()).toBe(404)
})

test('un brief complété resté sans projet se rattache à la main à un projet du client', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const first = await fixtures.createProject(clientId, { name: 'Projet A' })
  const second = await fixtures.createProject(clientId, { name: 'Projet B' })
  const legacy = await fixtures.createBrief({ clientId, status: 'completed', completedAt: new Date() })

  const { briefs } = await (await request.get(`/api/clients/${clientId}/briefs`)).json()
  expect(briefs.map((item: { id: number }) => item.id)).toEqual([legacy.id])

  const attached = await request.patch(`/api/briefs/${legacy.id}`, { data: { projectId: second.id } })
  expect(attached.status()).toBe(200)
  expect((await attached.json()).projectName).toBe('Projet B')
  expect((await (await request.get(`/api/projects/${second.id}/brief`)).json()).id).toBe(legacy.id)

  expect((await request.patch(`/api/briefs/${legacy.id}`, { data: { projectId: first.id } })).status()).toBe(409)
  expect((await (await request.get(`/api/clients/${clientId}/briefs`)).json()).briefs).toEqual([])
})

test('un projet en avant-vente reste invisible dans l’espace client', async ({ playwright, baseURL }) => {
  const [client] = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.name, 'Atelier Dupont'))
  // Nom en « zz » : si l'exclusion cassait, ce projet ne passerait pas devant le premier projet
  // attendu par les tests du portail qui tournent en parallèle.
  const [presale] = await db.insert(projectsTable)
    .values({ clientId: client!.id, name: 'zz Projet e2e en avant-vente', status: 'avant_vente' })
    .returning({ id: projectsTable.id })

  try {
    const storageState = await createSessionStorageState('jean.dupont@atelier-dupont.fr', 'password123', baseURL!)
    const portal = await playwright.request.newContext({ baseURL, storageState })

    const { projects } = await (await portal.get('/api/portal/projects')).json()
    expect(projects.length).toBeGreaterThan(0)
    expect(projects.map((project: { id: number }) => project.id)).not.toContain(presale!.id)
    expect((await portal.get(`/api/portal/projects/${presale!.id}/resources`)).status()).toBe(404)

    await portal.dispose()
  } finally {
    await db.delete(projectsTable).where(eq(projectsTable.id, presale!.id))
  }
})

test('la signature du devis fait sortir le projet de l’avant-vente', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const project = await fixtures.createProject(clientId, { status: 'avant_vente' })
  const [quote] = await db.insert(billingDocumentsTable)
    .values({ projectId: project.id, documentType: 'quote', status: 'sent' })
    .returning({ id: billingDocumentsTable.id })

  expect((await request.put(`/api/billing-documents/${quote!.id}`, { data: { status: 'completed' } })).status()).toBe(200)

  const [updated] = await db.select({ status: projectsTable.status }).from(projectsTable).where(eq(projectsTable.id, project.id))
  expect(updated!.status).toBe('sans_statut')
})

test('transférer un projet à un autre client remplace le lien en attente et détache le contact', async ({ request }) => {
  const origin = await fixtures.createProspect('Client d’origine')
  const destination = await fixtures.createProspect('Client de destination')
  const project = await fixtures.createProject(origin.clientId)
  const pending = await (await request.post(`/api/clients/${origin.clientId}/briefs`, { data: { projectId: project.id, contactId: origin.contactId } })).json()
  const oldToken = tokenFromUrl(pending.url)

  const response = await request.put(`/api/projects/${project.id}`, { data: { clientId: destination.clientId } })
  expect(response.status()).toBe(200)

  // L'ancien destinataire ne doit plus rien pouvoir lire du nouveau client.
  expect((await request.get(`/api/external/briefs/${oldToken}`, { headers: briefApiHeaders() })).status()).toBe(404)

  const [moved] = await db.select().from(projectBriefsTable).where(eq(projectBriefsTable.id, pending.id))
  expect(moved).toMatchObject({ clientId: destination.clientId, contactId: null, status: 'sent', openedAt: null })
  expect(moved!.token).not.toBe(oldToken)
})

test('transférer un projet garde son brief complété mais détache le contact de l’ancien client', async ({ request }) => {
  const origin = await fixtures.createProspect('Client d’origine')
  const destination = await fixtures.createProspect('Client de destination')
  const project = await fixtures.createProject(origin.clientId)
  const completed = await fixtures.createBrief({
    clientId: origin.clientId, contactId: origin.contactId, projectId: project.id, target: 'existing_project', status: 'completed', completedAt: new Date()
  })

  expect((await request.put(`/api/projects/${project.id}`, { data: { clientId: destination.clientId } })).status()).toBe(200)

  const [moved] = await db.select().from(projectBriefsTable).where(eq(projectBriefsTable.id, completed.id))
  expect(moved).toMatchObject({ clientId: destination.clientId, contactId: null, status: 'completed', token: completed.token })
})
