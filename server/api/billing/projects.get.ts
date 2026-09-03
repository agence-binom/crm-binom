import { and, asc, desc, eq, ilike, inArray, or } from 'drizzle-orm'
import { db } from '~/db'
import { buildBillingProjectStatus, type BillingProjectDocument, type BillingProjectStatus } from '~/lib/billing'
import { billingDocumentsTable } from '~/db/schema/billing-documents'
import { clientsTable } from '~/db/schema/clients'
import { projectsTable } from '~/db/schema/projects'
import { billingDashboardQuerySchema, type BillingDashboardQuery } from '~/validation/billing'

const buildWhereClause = (query: BillingDashboardQuery) => {
  const filters = [eq(projectsTable.archived, false)]

  if (query.search) {
    const searchPattern = `%${query.search}%`
    const searchFilter = or(
      ilike(projectsTable.name, searchPattern),
      ilike(clientsTable.name, searchPattern)
    )
    if (searchFilter) filters.push(searchFilter)
  }

  if (query.projectId) {
    filters.push(eq(projectsTable.id, query.projectId))
  }

  return and(...filters)
}

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, billingDashboardQuerySchema.parse)
  const whereClause = buildWhereClause(query)

  const projectOptions = await db
    .select({
      value: projectsTable.id,
      label: projectsTable.name
    })
    .from(projectsTable)
    .where(eq(projectsTable.archived, false))
    .orderBy(asc(projectsTable.name), asc(projectsTable.id))

  // `status` filters on `billingStatus.tone`, which only exists once the billing cascade has run in
  // TS - there is no SQL equivalent to filter on before pagination. So every non-archived project
  // matching search/projectId (narrowed in SQL) is loaded here, turned into a `BillingProjectStatus`
  // each, then filtered and paginated in memory. A billing dashboard's project count is an agency's
  // total project count, not a transactional table's row count, so this comfortably beats
  // re-deriving the cascade's conditional rules a second time in SQL.
  const projectRows = await db
    .select({
      id: projectsTable.id,
      clientId: projectsTable.clientId,
      name: projectsTable.name,
      status: projectsTable.status,
      startDate: projectsTable.startDate,
      endDate: projectsTable.endDate,
      requiresAcompte: projectsTable.requiresAcompte,
      clientEntityId: clientsTable.id,
      clientName: clientsTable.name
    })
    .from(projectsTable)
    .innerJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .where(whereClause)
    .orderBy(asc(clientsTable.name), asc(projectsTable.name), asc(projectsTable.id))

  const projectIds = projectRows.map(row => row.id)
  const documents = projectIds.length > 0
    ? await db
        .select({
          id: billingDocumentsTable.id,
          projectId: billingDocumentsTable.projectId,
          type: billingDocumentsTable.documentType,
          status: billingDocumentsTable.status,
          subtype: billingDocumentsTable.subtype,
          externalUrl: billingDocumentsTable.externalUrl,
          documentId: billingDocumentsTable.documentId,
          createdAt: billingDocumentsTable.createdAt,
          statusDate: billingDocumentsTable.statusDate,
          description: billingDocumentsTable.description
        })
        .from(billingDocumentsTable)
        .where(inArray(billingDocumentsTable.projectId, projectIds))
        .orderBy(asc(billingDocumentsTable.projectId), asc(billingDocumentsTable.documentType), desc(billingDocumentsTable.createdAt), desc(billingDocumentsTable.id))
    : []

  const documentsByProjectId = new Map<number, BillingProjectDocument[]>()

  documents.forEach((document) => {
    const item: BillingProjectDocument = {
      id: document.id,
      projectId: document.projectId,
      type: document.type as 'quote' | 'invoice' | 'commercial_proposal',
      status: document.status as 'draft' | 'sent' | 'completed',
      subtype: document.subtype,
      hasLink: Boolean(document.externalUrl?.trim()),
      hasFile: document.documentId !== null,
      externalUrl: document.externalUrl,
      createdAt: document.createdAt,
      statusDate: document.statusDate,
      description: document.description
    }

    const current = documentsByProjectId.get(document.projectId) ?? []
    current.push(item)
    documentsByProjectId.set(document.projectId, current)
  })

  const allItems: BillingProjectStatus[] = projectRows.map(row => buildBillingProjectStatus({
    project: {
      id: row.id,
      clientId: row.clientId,
      name: row.name,
      status: row.status,
      startDate: row.startDate,
      endDate: row.endDate,
      requiresAcompte: row.requiresAcompte,
      client: {
        id: row.clientEntityId,
        name: row.clientName
      }
    },
    documents: documentsByProjectId.get(row.id) ?? []
  }))

  const filteredItems = query.status === 'all'
    ? allItems
    : allItems.filter(item => item.billingStatus.tone === query.status)

  const totalItems = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize))
  const page = Math.min(query.page, totalPages)
  const offset = (page - 1) * query.pageSize

  return {
    items: filteredItems.slice(offset, offset + query.pageSize),
    projectOptions,
    pagination: {
      page,
      pageSize: query.pageSize,
      totalItems,
      totalPages
    }
  }
})
