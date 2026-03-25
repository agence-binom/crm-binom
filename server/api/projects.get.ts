import { asc, eq } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { projectsTable } from '~/db/schema/projects'

export default defineEventHandler(async () => {
  const projects = await db
    .select({
      id: projectsTable.id,
      clientId: projectsTable.clientId,
      name: projectsTable.name,
      description: projectsTable.description,
      status: projectsTable.status,
      url: projectsTable.url,
      notes: projectsTable.notes,
      startDate: projectsTable.startDate,
      endDate: projectsTable.endDate,
      links: projectsTable.links,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
      clientName: clientsTable.name
    })
    .from(projectsTable)
    .innerJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .orderBy(asc(projectsTable.name), asc(projectsTable.id))

  return { projects }
})
