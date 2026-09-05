import { asc, desc, eq } from 'drizzle-orm'
import { db } from '~/db'
import { billingDocumentsTable } from '~/db/schema/billing-documents'
import { clientsTable } from '~/db/schema/clients'
import { documentsTable } from '~/db/schema/documents'
import { projectsTable } from '~/db/schema/projects'
import { resourcesTable } from '~/db/schema/resources'
import { tasksTable } from '~/db/schema/tasks'
import { usersTable } from '~/db/schema/users'
import { annotateDocumentLifecycle, type BillingDocumentType } from '~/lib/documents'
import { projectIdSchema } from '~/validation/projects'
import { withDocumentsDownloadUrls } from '~~/server/utils/documents'
import { withResourcesDownloadUrls } from '~~/server/utils/resources'

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
      requiresAcompte: projectsTable.requiresAcompte,
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

  const [tasks, users, projectOptions, documents, resources] = await Promise.all([
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
        name: projectsTable.name,
        clientName: clientsTable.name
      })
      .from(projectsTable)
      .innerJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
      .orderBy(asc(projectsTable.name)),
    db
      .select({
        id: billingDocumentsTable.id,
        projectId: billingDocumentsTable.projectId,
        documentType: billingDocumentsTable.documentType,
        subtype: billingDocumentsTable.subtype,
        status: billingDocumentsTable.status,
        statusDate: billingDocumentsTable.statusDate,
        externalUrl: billingDocumentsTable.externalUrl,
        description: billingDocumentsTable.description,
        documentId: billingDocumentsTable.documentId,
        createdAt: billingDocumentsTable.createdAt,
        updatedAt: billingDocumentsTable.updatedAt,
        filename: documentsTable.filename,
        filepath: documentsTable.filepath,
        mimetype: documentsTable.mimetype,
        size: documentsTable.size
      })
      .from(billingDocumentsTable)
      .leftJoin(documentsTable, eq(billingDocumentsTable.documentId, documentsTable.id))
      .where(eq(billingDocumentsTable.projectId, id)),
    db
      .select()
      .from(resourcesTable)
      .where(eq(resourcesTable.projectId, id))
      .orderBy(desc(resourcesTable.createdAt))
  ])

  // Annotated here so the project detail page reads `lifecycle` straight off the response
  // instead of recomputing it client-side.
  const annotatedDocuments = annotateDocumentLifecycle(documents.map(document => ({ ...document, type: document.documentType as BillingDocumentType })))
  const documentsWithUrls = await withDocumentsDownloadUrls(event, annotatedDocuments)
  const resourcesWithUrls = await withResourcesDownloadUrls(event, resources)

  return {
    project: {
      id: projectRow.id,
      clientId: projectRow.clientId,
      name: projectRow.name,
      description: projectRow.description,
      status: projectRow.status,
      startDate: projectRow.startDate,
      endDate: projectRow.endDate,
      requiresAcompte: projectRow.requiresAcompte,
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
      invoice: documentsWithUrls.filter(document => document.documentType === 'invoice'),
      commercial_proposal: documentsWithUrls.filter(document => document.documentType === 'commercial_proposal')
    },
    resources: resourcesWithUrls
  }
})
