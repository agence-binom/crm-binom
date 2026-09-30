import { eq } from 'drizzle-orm'
import { test, expect } from '@playwright/test'
import { db } from '../app/db'
import { projectNotesTable } from '../app/db/schema/project-notes'
import { projectsTable } from '../app/db/schema/projects'
import { createSessionStorageState } from './helpers/better-auth-session'

/**
 * Les notes de projet sont internes à l'agence : elles vivent hors de /api/portal/*, et le
 * middleware 01-auth.ts refuse tout email absent de public.users. Ce fichier verrouille ce
 * comportement pour qu'un futur déplacement des routes ne les expose pas au portail par erreur.
 *
 * Tourne une fois par projet Playwright (chromium, firefox, webkit) en parallèle : chaque test
 * crée ses propres notes et ne compte jamais le total des notes d'un projet.
 */

const textDoc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })

let projectId: number
const createdNoteIds: number[] = []

test.beforeAll(async () => {
  const [project] = await db.select({ id: projectsTable.id }).from(projectsTable).where(eq(projectsTable.name, 'Refonte site vitrine'))
  projectId = project!.id
})

test.afterAll(async () => {
  for (const id of createdNoteIds) {
    await db.delete(projectNotesTable).where(eq(projectNotesTable.id, id))
  }
})

test('un membre du staff crée, lit, liste, modifie et supprime une note', async ({ request }) => {
  const createResponse = await request.post(`/api/projects/${projectId}/notes`, {
    data: { content: textDoc('Première ligne e2e\nsuite') }
  })
  expect(createResponse.status()).toBe(201)
  const created = await createResponse.json()
  createdNoteIds.push(created.id)
  expect(created.contentText).toBe('Première ligne e2e\nsuite')

  const getResponse = await request.get(`/api/notes/${created.id}`)
  expect(getResponse.status()).toBe(200)
  expect((await getResponse.json()).content).toEqual(textDoc('Première ligne e2e\nsuite'))

  const listResponse = await request.get(`/api/projects/${projectId}/notes`, { params: { q: 'ligne e2e' } })
  expect(listResponse.status()).toBe(200)
  const { notes } = await listResponse.json()
  const summary = notes.find((note: { id: number }) => note.id === created.id)
  expect(summary.displayTitle).toBe('Première ligne e2e')
  expect(summary).not.toHaveProperty('content')

  const patchResponse = await request.patch(`/api/notes/${created.id}`, {
    data: { updatedAt: created.updatedAt, title: 'Titre e2e' }
  })
  expect(patchResponse.status()).toBe(200)
  const updated = await patchResponse.json()
  expect(updated.title).toBe('Titre e2e')
  expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(created.updatedAt).getTime())

  const deleteResponse = await request.delete(`/api/notes/${created.id}`)
  expect(deleteResponse.status()).toBe(204)
  expect((await request.get(`/api/notes/${created.id}`)).status()).toBe(404)
})

test('un PATCH avec un updatedAt périmé renvoie 409 sans écraser la note', async ({ request }) => {
  const created = await (await request.post(`/api/projects/${projectId}/notes`, { data: { title: 'Version A' } })).json()
  createdNoteIds.push(created.id)

  const first = await request.patch(`/api/notes/${created.id}`, { data: { updatedAt: created.updatedAt, title: 'Version B' } })
  expect(first.status()).toBe(200)

  const stale = await request.patch(`/api/notes/${created.id}`, { data: { updatedAt: created.updatedAt, title: 'Version C' } })
  expect(stale.status()).toBe(409)

  expect((await (await request.get(`/api/notes/${created.id}`)).json()).title).toBe('Version B')
})

test('les routes de notes renvoient 400 et 404 sur une entrée invalide ou absente', async ({ request }) => {
  expect((await request.post(`/api/projects/${projectId}/notes`, { data: { content: { type: 'paragraph' } } })).status()).toBe(400)
  expect((await request.patch('/api/notes/1', { data: { title: 'Sans updatedAt' } })).status()).toBe(400)
  expect((await request.get('/api/notes/abc')).status()).toBe(400)

  expect((await request.get('/api/projects/999999999/notes')).status()).toBe(404)
  expect((await request.post('/api/projects/999999999/notes', { data: {} })).status()).toBe(404)
  expect((await request.get('/api/notes/999999999')).status()).toBe(404)
  expect((await request.patch('/api/notes/999999999', { data: { updatedAt: new Date().toISOString(), title: 'x' } })).status()).toBe(404)
  expect((await request.delete('/api/notes/999999999')).status()).toBe(404)
})

test.describe('accès depuis le portail client', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('un contact portail actif ne peut atteindre aucune route de notes', async ({ browser, baseURL }) => {
    const [note] = await db.insert(projectNotesTable).values({ projectId, title: 'Note interne e2e' }).returning()
    createdNoteIds.push(note!.id)

    const storageState = await createSessionStorageState('jean.dupont@atelier-dupont.fr', 'password123', baseURL!)
    const context = await browser.newContext({ storageState })
    const request = context.request

    const responses = await Promise.all([
      request.get(`/api/projects/${projectId}/notes`),
      request.post(`/api/projects/${projectId}/notes`, { data: { title: 'Intrusion' } }),
      request.get(`/api/notes/${note!.id}`),
      request.patch(`/api/notes/${note!.id}`, { data: { updatedAt: note!.updatedAt.toISOString(), title: 'Intrusion' } }),
      request.delete(`/api/notes/${note!.id}`)
    ])

    for (const response of responses) {
      expect(response.status()).toBe(403)
    }

    const [unchanged] = await db.select().from(projectNotesTable).where(eq(projectNotesTable.id, note!.id))
    expect(unchanged?.title).toBe('Note interne e2e')

    await context.close()
  })

  test('une requête sans session est refusée', async ({ request }) => {
    expect((await request.get(`/api/projects/${projectId}/notes`)).status()).toBe(401)
  })
})
