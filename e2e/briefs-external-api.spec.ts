import { request as httpRequest } from 'node:http'
import { eq } from 'drizzle-orm'
import { test, expect } from '@playwright/test'
import { db } from '../app/db'
import { projectBriefsTable } from '../app/db/schema/project-briefs'
import { projectsTable } from '../app/db/schema/projects'
import { generateBriefToken } from '../server/lib/external-api'
import { briefApiHeaders } from './helpers/brief-api'
import { createBriefFixtures } from './helpers/brief-fixtures'

/**
 * Contrat avec le site public (docs/brief-api-contract.md) : préremplissage, soumission unique,
 * liens expirés ou inconnus - et ce que la réception fait du projet. Aucune session ici : seul le
 * secret partagé ouvre /api/external/*.
 *
 * Les prospects de test n'ont pas de site et les réponses envoyées n'en déclarent pas : l'enrichissement
 * lancé après chaque soumission s'arrête donc sans requête réseau (l'URL du projet est couverte par
 * tests/brief-project.test.ts).
 */
test.use({ storageState: { cookies: [], origins: [] } })

const fixtures = createBriefFixtures()
test.afterAll(fixtures.cleanup)

const readBrief = async (id: number) => {
  const [brief] = await db.select().from(projectBriefsTable).where(eq(projectBriefsTable.id, id))
  return brief!
}

const projectsOf = (clientId: number) => db.select().from(projectsTable).where(eq(projectsTable.clientId, clientId))

const validSubmission = {
  formVersion: '2026-10',
  answers: [
    { id: 'project_type', section: 'Votre projet', label: 'Quel est votre projet ?', status: 'answered', value: 'ecommerce' },
    { id: 'budget_range', section: 'Votre projet', label: 'Budget envisagé', status: 'answered', value: '3k_6k' },
    { id: 'goals', section: 'Votre projet', label: 'Vos objectifs', status: 'answered', value: ['Vendre en ligne'] },
    { id: 'deadline', section: 'Votre projet', label: 'Échéance', status: 'answered', value: '2027-03-01' },
    { id: 'decision_maker', section: 'Votre projet', label: 'Qui décide ?', status: 'unknown' },
    { id: 'favorite_flower', section: 'Question ajoutée plus tard', label: 'Votre fleur préférée ?', status: 'answered', value: 'Pivoine' }
  ]
}

const submit = (request: Parameters<Parameters<typeof test>[1]>[0]['request'], token: string, data: unknown = validSubmission) => (
  request.post(`/api/external/briefs/${token}/submission`, { headers: briefApiHeaders(), data })
)

test('refuse tout appel sans le secret partagé', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const brief = await fixtures.createBrief({ clientId })

  expect((await request.get(`/api/external/briefs/${brief.token}`)).status()).toBe(401)
  expect((await request.get(`/api/external/briefs/${brief.token}`, { headers: briefApiHeaders('mauvais-secret-mais-suffisamment-long-000') })).status()).toBe(401)
  expect((await request.post(`/api/external/briefs/${brief.token}/submission`, { data: validSubmission })).status()).toBe(401)

  expect((await readBrief(brief.id)).status).toBe('sent')
})

test('le préremplissage renvoie les infos connues et passe le brief à « ouvert » une seule fois', async ({ request }) => {
  const { clientId, clientName, contactId } = await fixtures.createProspect()
  const brief = await fixtures.createBrief({ clientId, contactId })

  const response = await request.get(`/api/external/briefs/${brief.token}`, { headers: briefApiHeaders() })
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body.status).toBe('opened')
  expect(body.prefill).toEqual({
    firstName: 'Rose',
    lastName: 'Garnier',
    company: clientName,
    email: 'rose@prospect-e2e.test',
    phone: '+33 6 56 78 90 12',
    website: null,
    projectName: null,
    previousAnswers: []
  })

  const opened = await readBrief(brief.id)
  expect(opened.status).toBe('opened')
  expect(opened.openedAt).not.toBeNull()

  await request.get(`/api/external/briefs/${brief.token}`, { headers: briefApiHeaders() })
  expect((await readBrief(brief.id)).openedAt).toEqual(opened.openedAt)
})

test('un brief envoyé ou ouvert mais pas complété ne crée aucun projet', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const brief = await fixtures.createBrief({ clientId })

  await request.get(`/api/external/briefs/${brief.token}`, { headers: briefApiHeaders() })

  expect(await projectsOf(clientId)).toHaveLength(0)
  expect((await readBrief(brief.id)).projectId).toBeNull()
})

test('la réception d’un brief « nouveau projet » crée le projet en avant-vente, prérempli', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const brief = await fixtures.createBrief({ clientId })

  const first = await submit(request, brief.token)
  expect(first.status()).toBe(201)
  expect(await first.json()).toEqual({ status: 'completed', completedAt: expect.any(String) })

  const completed = await readBrief(brief.id)
  expect(completed.status).toBe('completed')
  expect(completed.formVersion).toBe('2026-10')
  expect(completed.projectType).toBe('ecommerce')
  expect(completed.summary?.decisionMaker).toEqual({ status: 'unknown' })
  expect(completed.answers).toEqual(validSubmission.answers)

  const projects = await projectsOf(clientId)
  expect(projects).toHaveLength(1)
  const project = projects[0]!
  expect(completed.projectId).toBe(project.id)
  expect(project.name).toBe('Boutique en ligne')
  expect(project.status).toBe('avant_vente')
  expect(project.url).toBeNull()
  expect(project.description).toBe('Objectifs :\n- Vendre en ligne')
  expect(project.notes).toContain('- Budget : 3 à 6 k€')
  expect(project.endDate?.toISOString().slice(0, 10)).toBe('2027-03-01')
})

test('une seconde soumission est refusée en 409 sans créer de second projet', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const brief = await fixtures.createBrief({ clientId })

  expect((await submit(request, brief.token)).status()).toBe(201)

  const second = await submit(request, brief.token, { ...validSubmission, answers: [validSubmission.answers[0]] })
  expect(second.status()).toBe(409)
  expect((await second.json()).data.code).toBe('brief_already_completed')
  expect((await readBrief(brief.id)).answers).toEqual(validSubmission.answers)
  expect(await projectsOf(clientId)).toHaveLength(1)

  expect((await request.get(`/api/external/briefs/${brief.token}`, { headers: briefApiHeaders() })).status()).toBe(409)
})

test('deux soumissions simultanées : une seule acceptée, un seul projet créé', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const brief = await fixtures.createBrief({ clientId })

  const responses = await Promise.all([1, 2].map(() => submit(request, brief.token)))

  expect(responses.map(response => response.status()).sort()).toEqual([201, 409])
  expect(await projectsOf(clientId)).toHaveLength(1)
})

test('un brief sur un projet existant complète ses champs vides sans rien écraser', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const project = await fixtures.createProject(clientId, { name: 'Notre nom de projet', description: 'Description saisie par nous', status: 'sans_statut' })
  const brief = await fixtures.createBrief({ clientId, projectId: project.id, target: 'existing_project' })

  const prefill = await (await request.get(`/api/external/briefs/${brief.token}`, { headers: briefApiHeaders() })).json()
  expect(prefill.prefill.projectName).toBe('Notre nom de projet')

  expect((await submit(request, brief.token)).status()).toBe(201)

  const projects = await projectsOf(clientId)
  expect(projects).toHaveLength(1)
  const updated = projects[0]!
  expect(updated.name).toBe('Notre nom de projet')
  expect(updated.description).toBe('Description saisie par nous')
  expect(updated.status).toBe('sans_statut')
  expect(updated.endDate?.toISOString().slice(0, 10)).toBe('2027-03-01')
  expect(updated.notes).toContain('Type de projet : Boutique en ligne')

  const completed = await readBrief(brief.id)
  expect(completed.projectId).toBe(project.id)
  expect(completed.target).toBe('existing_project')
  expect(completed.appliedFields).toEqual(['endDate', 'notes'])
})

test('un client qui revient retrouve ses réponses techniques précédentes au préremplissage', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const firstBrief = await fixtures.createBrief({ clientId })
  expect((await submit(request, firstBrief.token, {
    formVersion: '2026-10',
    answers: [
      { id: 'project_type', label: 'Projet', status: 'answered', value: 'redesign' },
      { id: 'budget_range', label: 'Budget', status: 'answered', value: 'gt_25k' },
      { id: 'domain_registrar', label: 'Domaine acheté chez', status: 'answered', value: 'OVH' },
      { id: 'email_provider', label: 'Emails gérés chez', status: 'unknown' },
      { id: 'tools_to_connect', label: 'Outils', status: 'answered', value: ['Stripe'] }
    ]
  })).status()).toBe(201)

  const secondBrief = await fixtures.createBrief({ clientId })
  const { prefill } = await (await request.get(`/api/external/briefs/${secondBrief.token}`, { headers: briefApiHeaders() })).json()

  expect(prefill.previousAnswers).toEqual([
    { id: 'domain_registrar', status: 'answered', value: 'OVH' },
    { id: 'email_provider', status: 'unknown' },
    { id: 'tools_to_connect', status: 'answered', value: ['Stripe'] }
  ])
})

test('un lien expiré est refusé en 410, au préremplissage comme à la soumission', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const brief = await fixtures.createBrief({ clientId, expiresAt: new Date(Date.now() - 60_000) })

  const prefill = await request.get(`/api/external/briefs/${brief.token}`, { headers: briefApiHeaders() })
  expect(prefill.status()).toBe(410)
  expect((await prefill.json()).data.code).toBe('brief_expired')

  expect((await submit(request, brief.token)).status()).toBe(410)

  const unchanged = await readBrief(brief.id)
  expect(unchanged.status).toBe('sent')
  expect(unchanged.answers).toBeNull()
  expect(await projectsOf(clientId)).toHaveLength(0)
})

test('un jeton inconnu est refusé en 404', async ({ request }) => {
  const token = generateBriefToken()

  const prefill = await request.get(`/api/external/briefs/${token}`, { headers: briefApiHeaders() })
  expect(prefill.status()).toBe(404)
  expect((await prefill.json()).data.code).toBe('brief_not_found')

  expect((await submit(request, token)).status()).toBe(404)
})

test('un payload invalide est refusé en 400 sans consommer le lien ni créer de projet', async ({ request }) => {
  const { clientId } = await fixtures.createProspect()
  const brief = await fixtures.createBrief({ clientId })

  const invalid = await submit(request, brief.token, { answers: [{ id: 'project_type', label: 'Projet', status: 'peut-être' }] })
  expect(invalid.status()).toBe(400)
  expect((await readBrief(brief.id)).status).toBe('sent')
  expect(await projectsOf(clientId)).toHaveLength(0)

  expect((await submit(request, brief.token)).status()).toBe(201)
})

test('une soumission chunked trop volumineuse est refusée en 413, même sans Content-Length', async ({ baseURL }) => {
  const { clientId } = await fixtures.createProspect()
  const brief = await fixtures.createBrief({ clientId })

  // Le client HTTP de Playwright pose toujours Content-Length : node:http permet d'envoyer en
  // Transfer-Encoding: chunked, le seul cas que le contrôle de l'en-tête ne couvre pas.
  const status = await new Promise<number>((resolve, reject) => {
    const req = httpRequest(new URL(`/api/external/briefs/${brief.token}/submission`, baseURL), {
      method: 'POST',
      headers: { ...briefApiHeaders(), 'content-type': 'application/json', 'transfer-encoding': 'chunked' }
    }, (response) => {
      response.resume()
      resolve(response.statusCode!)
    })
    req.on('error', reject)
    req.setTimeout(15_000, () => req.destroy(new Error('Aucune réponse du serveur à la soumission chunked')))
    req.write('{"formVersion":"1","answers":[')
    const answer = JSON.stringify({ id: 'x', label: 'x', status: 'answered', value: 'a'.repeat(9_000) })
    for (let i = 0; i < 40; i++) req.write(`${i > 0 ? ',' : ''}${answer.replace('"x"', `"q${i}"`)}`)
    req.end(']}')
  })

  expect(status).toBe(413)
  expect((await readBrief(brief.id)).status).toBe('sent')
})
