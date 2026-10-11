import { asc, eq } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { contactsTable } from '~/db/schema/contacts'
import { projectBriefsTable } from '~/db/schema/project-briefs'
import { projectsTable } from '~/db/schema/projects'
import type { BriefStatus } from '~/constants/briefs'
import { getBriefDisplayStatus } from '~/lib/briefs'
import { clientIdSchema } from '~/validation/clients'
import { withProjectTimeSpent } from '~~/server/utils/time-entries'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, clientIdSchema.parse)

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, id))

  if (!client) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Client non trouvé'
    })
  }

  const [contacts, projects] = await Promise.all([
    db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.clientId, id))
      .orderBy(asc(contactsTable.lastName), asc(contactsTable.firstName), asc(contactsTable.id)),
    db
      .select({ project: projectsTable, briefId: projectBriefsTable.id, briefStatus: projectBriefsTable.status, briefExpiresAt: projectBriefsTable.expiresAt })
      .from(projectsTable)
      .leftJoin(projectBriefsTable, eq(projectBriefsTable.projectId, projectsTable.id))
      .where(eq(projectsTable.clientId, id))
      .orderBy(asc(projectsTable.name), asc(projectsTable.id))
  ])

  const now = new Date()
  const projectsWithBrief = projects.map(({ project, briefId, briefStatus, briefExpiresAt }) => ({
    ...project,
    brief: briefId && briefStatus && briefExpiresAt
      ? { id: briefId, status: getBriefDisplayStatus({ status: briefStatus as BriefStatus, expiresAt: briefExpiresAt }, now) }
      : null
  }))

  return {
    client,
    contacts,
    projects: await withProjectTimeSpent(projectsWithBrief)
  }
})
