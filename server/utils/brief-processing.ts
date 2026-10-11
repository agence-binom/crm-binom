import { and, eq, isNull } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { projectBriefsTable } from '~/db/schema/project-briefs'
import { projectsTable } from '~/db/schema/projects'
import { usersTable } from '~/db/schema/users'
import { normalizeDomain } from '~/lib/briefs'
import { enrichDomain } from '../lib/brief-enrichment'
import { sendBriefCompletedEmail } from '../lib/mail'

// Ne lève jamais : l'enrichissement tourne après la réception des réponses (event.waitUntil) ou à
// la demande, et son échec ne doit rien casser d'autre - il est seulement tracé dans
// enrichmentStatus pour que l'UI propose de relancer.
export const runBriefEnrichment = async (briefId: number) => {
  try {
    const [row] = await db
      .select({ domain: projectBriefsTable.domain, projectUrl: projectsTable.url, website: clientsTable.website })
      .from(projectBriefsTable)
      .innerJoin(clientsTable, eq(projectBriefsTable.clientId, clientsTable.id))
      .leftJoin(projectsTable, eq(projectBriefsTable.projectId, projectsTable.id))
      .where(eq(projectBriefsTable.id, briefId))
    if (!row) return

    // Le plus précis d'abord : ce que le prospect déclare, puis le projet, puis la fiche client.
    const domain = row.domain ?? normalizeDomain(row.projectUrl) ?? normalizeDomain(row.website)
    if (!domain) {
      await db.update(projectBriefsTable).set({
        enrichmentStatus: 'failed',
        enrichment: { domain: '', errors: { domain: 'Aucun nom de domaine exploitable (ni déclaré, ni sur le projet, ni sur la fiche)' } },
        enrichedAt: new Date(),
        updatedAt: new Date()
      }).where(eq(projectBriefsTable.id, briefId))
      return
    }

    await db.update(projectBriefsTable)
      .set({ enrichmentStatus: 'pending', updatedAt: new Date() })
      .where(eq(projectBriefsTable.id, briefId))

    const enrichment = await enrichDomain(domain)

    await db.update(projectBriefsTable).set({
      enrichment,
      enrichmentStatus: 'done',
      enrichedAt: new Date(),
      updatedAt: new Date()
    }).where(eq(projectBriefsTable.id, briefId))
  } catch (error) {
    console.error(`Échec de l’enrichissement du brief ${briefId}`, error)
    await db.update(projectBriefsTable)
      .set({ enrichmentStatus: 'failed', updatedAt: new Date() })
      .where(eq(projectBriefsTable.id, briefId))
      .catch(() => {})
  }
}

export const notifyBriefCompleted = async (briefId: number, crmSiteUrl: string | undefined) => {
  try {
    const [row] = await db
      .select({
        clientId: projectBriefsTable.clientId,
        clientName: clientsTable.name,
        projectId: projectBriefsTable.projectId,
        target: projectBriefsTable.target,
        notifiedAt: projectBriefsTable.notifiedAt
      })
      .from(projectBriefsTable)
      .innerJoin(clientsTable, eq(projectBriefsTable.clientId, clientsTable.id))
      .where(eq(projectBriefsTable.id, briefId))
    if (!row || row.notifiedAt || !row.projectId) return

    const recipients = (await db.select({ email: usersTable.email }).from(usersTable)).map(user => user.email)
    if (recipients.length === 0) return

    const projectUrl = `${(crmSiteUrl ?? '').replace(/\/+$/, '')}/clients/${row.clientId}/projects/${row.projectId}`
    await sendBriefCompletedEmail(recipients, { clientName: row.clientName, projectUrl, projectCreated: row.target === 'new_project' })

    await db.update(projectBriefsTable)
      .set({ notifiedAt: new Date() })
      .where(and(eq(projectBriefsTable.id, briefId), isNull(projectBriefsTable.notifiedAt)))
  } catch (error) {
    console.error(`Échec de la notification du brief ${briefId}`, error)
  }
}
