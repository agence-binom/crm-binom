import { and, desc, eq, ne } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { contactsTable } from '~/db/schema/contacts'
import { projectBriefsTable } from '~/db/schema/project-briefs'
import { projectsTable } from '~/db/schema/projects'
import type { BriefStatus } from '~/constants/briefs'
import { selectReusableAnswers } from '~/lib/brief-project'
import { getBriefLinkState } from '~/lib/briefs'
import { briefTokenSchema } from '~/validation/briefs'
import { toPublicDatabaseError } from '~~/server/utils/database-errors'
import { briefLinkError } from '~~/server/utils/brief-link-errors'

// Appelé par le site public à l'ouverture du lien (secret vérifié par middleware/01-auth.ts).
export default defineEventHandler(async (event) => {
  const { token } = await getValidatedRouterParams(event, briefTokenSchema.parse)

  try {
    const [row] = await db
      .select({
        id: projectBriefsTable.id,
        clientId: projectBriefsTable.clientId,
        status: projectBriefsTable.status,
        expiresAt: projectBriefsTable.expiresAt,
        company: clientsTable.name,
        clientEmail: clientsTable.email,
        clientPhone: clientsTable.phone,
        website: clientsTable.website,
        projectName: projectsTable.name,
        projectUrl: projectsTable.url,
        firstName: contactsTable.firstName,
        lastName: contactsTable.lastName,
        contactEmail: contactsTable.email,
        contactPhone: contactsTable.phone,
        contactMobile: contactsTable.mobile
      })
      .from(projectBriefsTable)
      .innerJoin(clientsTable, eq(projectBriefsTable.clientId, clientsTable.id))
      .leftJoin(contactsTable, eq(projectBriefsTable.contactId, contactsTable.id))
      .leftJoin(projectsTable, eq(projectBriefsTable.projectId, projectsTable.id))
      .where(eq(projectBriefsTable.token, token))

    if (!row) throw briefLinkError('not_found')

    const linkState = getBriefLinkState({ status: row.status as BriefStatus, expiresAt: row.expiresAt })
    if (linkState !== 'valid') throw briefLinkError(linkState)

    const [, [previousBrief]] = await Promise.all([
      // Conditionnel sur 'sent' : rouvrir le lien ne réécrit pas openedAt (première ouverture).
      row.status === 'sent'
        ? db.update(projectBriefsTable)
            .set({ status: 'opened', openedAt: new Date(), updatedAt: new Date() })
            .where(and(eq(projectBriefsTable.id, row.id), eq(projectBriefsTable.status, 'sent')))
        : null,
      // Un client qui revient n'a qu'à vérifier sa partie technique : on reprend ses réponses du
      // dernier brief complété (domaine, accès, emails, outils...), jamais le besoin ni le budget.
      db
        .select({ answers: projectBriefsTable.answers })
        .from(projectBriefsTable)
        .where(and(
          eq(projectBriefsTable.clientId, row.clientId),
          eq(projectBriefsTable.status, 'completed'),
          ne(projectBriefsTable.id, row.id)
        ))
        .orderBy(desc(projectBriefsTable.completedAt), desc(projectBriefsTable.id))
        .limit(1)
    ])

    return {
      status: 'opened',
      expiresAt: row.expiresAt.toISOString(),
      prefill: {
        firstName: row.firstName ?? null,
        lastName: row.lastName ?? null,
        company: row.company,
        email: row.contactEmail || row.clientEmail || null,
        phone: row.contactMobile || row.contactPhone || row.clientPhone || null,
        website: row.projectUrl || row.website || null,
        projectName: row.projectName ?? null,
        previousAnswers: selectReusableAnswers(previousBrief?.answers)
      }
    }
  } catch (error) {
    throw toPublicDatabaseError(error)
  }
})
