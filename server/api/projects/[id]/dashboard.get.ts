import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { documentsTable } from '~/db/schema/documents'
import { projectsTable } from '~/db/schema/projects'
import { tasksTable } from '~/db/schema/tasks'
import { usersTable } from '~/db/schema/users'
import { projectIdSchema } from '~/validation/projects'
import { withDocumentsDownloadUrls } from '~~/server/utils/documents'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, projectIdSchema.parse)

  const [projectRow] = await db
    .select({
      id: projectsTable.id,
      clientId: projectsTable.clientId,
      name: projectsTable.name,
      description: projectsTable.description,
      status: projectsTable.status,
      startDate: projectsTable.startDate,
      endDate: projectsTable.endDate,
      url: projectsTable.url,
      notes: projectsTable.notes,
      links: projectsTable.links,
      clientEntityId: clientsTable.id,
      clientName: clientsTable.name,
      clientEmail: clientsTable.email,
      clientPhone: clientsTable.phone,
      clientWebsite: clientsTable.website
    })
    .from(projectsTable)
    .innerJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .where(eq(projectsTable.id, id))

  if (!projectRow) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Projet non trouvé'
    })
  }

  const [tasks, users, projectOptions, documents] = await Promise.all([
    db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.projectId, id)),
    db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role
      })
      .from(usersTable)
      .orderBy(asc(usersTable.name)),
    db
      .select({
        id: projectsTable.id,
        name: projectsTable.name
      })
      .from(projectsTable)
      .orderBy(asc(projectsTable.name)),
    db
      .select()
      .from(documentsTable)
      .where(and(
        eq(documentsTable.entityType, 'project'),
        eq(documentsTable.entityId, id),
        inArray(documentsTable.documentType, ['quote', 'invoice'])
      ))
  ])

  const documentsWithUrls = await withDocumentsDownloadUrls(event, documents)

  return {
    project: {
      id: projectRow.id,
      clientId: projectRow.clientId,
      name: projectRow.name,
      description: projectRow.description,
      status: projectRow.status,
      startDate: projectRow.startDate,
      endDate: projectRow.endDate,
      url: projectRow.url,
      notes: projectRow.notes,
      links: projectRow.links,
      client: {
        id: projectRow.clientEntityId,
        name: projectRow.clientName,
        email: projectRow.clientEmail,
        phone: projectRow.clientPhone,
        website: projectRow.clientWebsite
      }
    },
    tasks,
    users,
    projectOptions,
    documents: {
      quote: documentsWithUrls.filter(document => document.documentType === 'quote'),
      invoice: documentsWithUrls.filter(document => document.documentType === 'invoice')
    }
  }
})
