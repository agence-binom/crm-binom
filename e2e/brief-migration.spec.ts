import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test, expect } from '@playwright/test'
import { client } from '../app/db'

/**
 * Reprise des briefs reçus avant leur rattachement aux projets (drizzle/0047_briefs_to_projects.sql).
 * Le bloc entre `-- reprise:start` et `-- reprise:end` est rejoué tel quel sur des fixtures, dans une
 * transaction annulée à la fin : la base de test n'en garde aucune trace.
 */

const ROLLBACK = new Error('rollback volontaire de la transaction de test')

const repriseStatements = () => {
  const migration = readFileSync(resolve('drizzle/0047_briefs_to_projects.sql'), 'utf8')
  const block = migration.split('-- reprise:start')[1]!.split('-- reprise:end')[0]!
  return block.split('--> statement-breakpoint').map(statement => statement.trim()).filter(Boolean)
}

test('la reprise crée, rattache ou laisse en attente chaque brief selon les projets du client', async () => {
  // Une seule exécution suffit : la reprise ne dépend pas du navigateur.
  test.skip(test.info().project.name !== 'chromium', 'Exécuté une fois, sur chromium')

  await client.begin(async (sql) => {
    const insertClient = async (name: string) => (await sql`insert into clients (name, "prospectionStatus") values (${name}, 'contacte') returning id`)[0]!.id as number
    const insertProject = async (clientId: number, name: string) => (await sql`
      insert into projects ("clientId", name, description, status) values (${clientId}, ${name}, 'Saisi par nous', 'sans_statut') returning id
    `)[0]!.id as number
    const insertBrief = async (clientId: number, status: string, extra: { projectType?: string, budgetRange?: string, domain?: string, deadline?: string, summary?: unknown } = {}) => (await sql`
      insert into project_briefs ("clientId", token, status, "expiresAt", "completedAt", "projectType", "budgetRange", domain, deadline, summary)
      values (${clientId}, ${`reprise-${clientId}-${status}-${Math.random().toString(36).slice(2)}`}, ${status}, now() + interval '30 days',
        ${status === 'completed' ? new Date().toISOString() : null}::timestamp, ${extra.projectType ?? null}, ${extra.budgetRange ?? null}, ${extra.domain ?? null},
        ${extra.deadline ?? null}::date, ${extra.summary ? JSON.stringify(extra.summary) : null}::jsonb)
      returning id
    `)[0]!.id as number

    const withoutProject = await insertClient('Reprise sans projet')
    const briefCreatingProject = await insertBrief(withoutProject, 'completed', {
      projectType: 'ecommerce',
      budgetRange: '3k_6k',
      domain: 'reprise.example',
      deadline: '2027-01-15',
      summary: {
        goals: { status: 'answered', value: ['Vendre en ligne', 'Gagner du temps'] },
        decisionMaker: { status: 'answered', value: 'La gérante' },
        deadlineContext: { status: 'unknown' }
      }
    })

    const withOneProject = await insertClient('Reprise un projet')
    const singleProject = await insertProject(withOneProject, 'Projet unique')
    const briefForSingleProject = await insertBrief(withOneProject, 'completed', { projectType: 'redesign', domain: 'autre.example' })

    const withTwoProjects = await insertClient('Reprise deux projets')
    await insertProject(withTwoProjects, 'Projet A')
    await insertProject(withTwoProjects, 'Projet B')
    const briefToAttachManually = await insertBrief(withTwoProjects, 'completed')

    const pendingClient = await insertClient('Reprise brief en attente')
    const pendingBrief = await insertBrief(pendingClient, 'sent')

    for (const statement of repriseStatements()) await sql.unsafe(statement)

    const briefs = await sql`select id, "projectId", target, "appliedFields" from project_briefs where id in ${sql([briefCreatingProject, briefForSingleProject, briefToAttachManually, pendingBrief])}`
    const byId = new Map(briefs.map(brief => [brief.id, brief]))

    // Client sans projet : projet créé comme à la réception d'un brief.
    const [created] = await sql`select *, "endDate"::date::text as "endDay" from projects where "clientId" = ${withoutProject}`
    expect(byId.get(briefCreatingProject)).toMatchObject({ projectId: created!.id, target: 'new_project' })
    expect(created).toMatchObject({
      name: 'Boutique en ligne',
      status: 'avant_vente',
      url: 'https://reprise.example',
      description: 'Objectifs :\n- Vendre en ligne\n- Gagner du temps',
      notes: 'Issu du brief pré-rendez-vous :\n- Type de projet : Boutique en ligne\n- Budget : 3 à 6 k€\n- Décideur : La gérante'
    })
    expect(created!.endDay).toBe('2027-01-15')

    // Client avec un seul projet : rattaché, projet intact.
    expect(byId.get(briefForSingleProject)).toMatchObject({ projectId: singleProject, target: 'existing_project', appliedFields: [] })
    const [untouched] = await sql`select name, description, url, status from projects where id = ${singleProject}`
    expect(untouched).toEqual({ name: 'Projet unique', description: 'Saisi par nous', url: null, status: 'sans_statut' })

    // Plusieurs projets : laissé à rattacher à la main. Non complété : reste en attente.
    expect(byId.get(briefToAttachManually)!.projectId).toBeNull()
    expect(byId.get(pendingBrief)!.projectId).toBeNull()
    expect(await sql`select id from projects where "clientId" = ${pendingClient}`).toHaveLength(0)

    // Idempotente : la rejouer ne crée ni ne déplace rien.
    for (const statement of repriseStatements()) await sql.unsafe(statement)
    expect(await sql`select id from projects where "clientId" = ${withoutProject}`).toHaveLength(1)

    throw ROLLBACK
  }).catch((error) => {
    if (error !== ROLLBACK) throw error
  })
})
