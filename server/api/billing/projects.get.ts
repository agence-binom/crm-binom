import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { db } from '~/db'
import { buildBillingProjectStatus, type BillingProjectDocument } from '~/lib/billing'
import { clientsTable } from '~/db/schema/clients'
import { documentsTable } from '~/db/schema/documents'
import { projectsTable } from '~/db/schema/projects'
import { billingDashboardQuerySchema, type BillingDashboardQuery } from '~/validation/billing'

const toNumber = (value: unknown) => Number(value ?? 0)

const buildDocumentsByProjectQuery = () => db
  .select({
    projectId: documentsTable.entityId,
    quoteTotal: sql<number>`sum(case when ${documentsTable.documentType} = 'quote' then 1 else 0 end)`.as('quote_total'),
    quoteWithLinkCount: sql<number>`sum(case when ${documentsTable.documentType} = 'quote' and coalesce(${documentsTable.externalUrl}, '') <> '' then 1 else 0 end)`.as('quote_with_link_count'),
    invoiceTotal: sql<number>`sum(case when ${documentsTable.documentType} = 'invoice' then 1 else 0 end)`.as('invoice_total'),
    invoiceWithLinkCount: sql<number>`sum(case when ${documentsTable.documentType} = 'invoice' and coalesce(${documentsTable.externalUrl}, '') <> '' then 1 else 0 end)`.as('invoice_with_link_count')
  })
  .from(documentsTable)
  .where(and(
    eq(documentsTable.entityType, 'project'),
    inArray(documentsTable.documentType, ['quote', 'invoice'])
  ))
  .groupBy(documentsTable.entityId)
  .as('documents_by_project')

const buildWhereClause = (
  query: BillingDashboardQuery,
  documentsByProject: ReturnType<typeof buildDocumentsByProjectQuery>
) => {
  const quoteTotal = sql<number>`coalesce(${documentsByProject.quoteTotal}, 0)`
  const quoteWithLinkCount = sql<number>`coalesce(${documentsByProject.quoteWithLinkCount}, 0)`
  const invoiceTotal = sql<number>`coalesce(${documentsByProject.invoiceTotal}, 0)`
  const invoiceWithLinkCount = sql<number>`coalesce(${documentsByProject.invoiceWithLinkCount}, 0)`
  const missingLinkCount = sql<number>`(${quoteTotal} - ${quoteWithLinkCount}) + (${invoiceTotal} - ${invoiceWithLinkCount})`

  const filters = []

  if (query.search) {
    const searchPattern = `%${query.search}%`
    filters.push(or(
      ilike(projectsTable.name, searchPattern),
      ilike(clientsTable.name, searchPattern)
    ))
  }

  if (query.projectId) {
    filters.push(eq(projectsTable.id, query.projectId))
  }

  switch (query.status) {
    case 'missing_quote_pdf':
      filters.push(sql`${quoteTotal} = 0`)
      break
    case 'missing_invoice_pdf':
      filters.push(sql`${invoiceTotal} = 0`)
      break
    case 'missing_facturenet_link':
      filters.push(sql`${missingLinkCount} > 0`)
      break
    case 'complete':
      filters.push(sql`${quoteTotal} > 0 and ${quoteTotal} = ${quoteWithLinkCount} and ${invoiceTotal} > 0 and ${invoiceTotal} = ${invoiceWithLinkCount}`)
      break
  }

  return filters.length > 0 ? and(...filters) : undefined
}

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, billingDashboardQuerySchema.parse)
  const documentsByProject = buildDocumentsByProjectQuery()
  const whereClause = buildWhereClause(query, documentsByProject)

  const projectOptions = await db
    .select({
      value: projectsTable.id,
      label: projectsTable.name
    })
    .from(projectsTable)
    .orderBy(asc(projectsTable.name), asc(projectsTable.id))

  const [countRow] = await db
    .select({
      total: sql<number>`count(*)`
    })
    .from(projectsTable)
    .innerJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(documentsByProject, eq(documentsByProject.projectId, projectsTable.id))
    .where(whereClause)

  const totalItems = toNumber(countRow?.total)
  const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize))
  const page = Math.min(query.page, totalPages)
  const offset = (page - 1) * query.pageSize

  const rows = await db
    .select({
      id: projectsTable.id,
      clientId: projectsTable.clientId,
      name: projectsTable.name,
      status: projectsTable.status,
      startDate: projectsTable.startDate,
      endDate: projectsTable.endDate,
      clientEntityId: clientsTable.id,
      clientName: clientsTable.name,
      quoteTotal: sql<number>`coalesce(${documentsByProject.quoteTotal}, 0)`,
      quoteWithLinkCount: sql<number>`coalesce(${documentsByProject.quoteWithLinkCount}, 0)`,
      invoiceTotal: sql<number>`coalesce(${documentsByProject.invoiceTotal}, 0)`,
      invoiceWithLinkCount: sql<number>`coalesce(${documentsByProject.invoiceWithLinkCount}, 0)`
    })
    .from(projectsTable)
    .innerJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(documentsByProject, eq(documentsByProject.projectId, projectsTable.id))
    .where(whereClause)
    .orderBy(asc(clientsTable.name), asc(projectsTable.name), asc(projectsTable.id))
    .limit(query.pageSize)
    .offset(offset)

  const projectIds = rows.map(row => row.id)
  const documents = projectIds.length > 0
    ? await db
        .select({
          id: documentsTable.id,
          projectId: documentsTable.entityId,
          name: documentsTable.name,
          type: documentsTable.documentType,
          externalUrl: documentsTable.externalUrl,
          createdAt: documentsTable.createdAt
        })
        .from(documentsTable)
        .where(and(
          eq(documentsTable.entityType, 'project'),
          inArray(documentsTable.entityId, projectIds),
          inArray(documentsTable.documentType, ['quote', 'invoice'])
        ))
        .orderBy(asc(documentsTable.entityId), asc(documentsTable.documentType), desc(documentsTable.createdAt), desc(documentsTable.id))
    : []

  const documentsByProjectId = new Map<number, BillingProjectDocument[]>()

  documents.forEach((document) => {
    const item: BillingProjectDocument = {
      id: document.id,
      projectId: document.projectId,
      name: document.name,
      type: document.type as 'quote' | 'invoice',
      hasLink: Boolean(document.externalUrl?.trim()),
      externalUrl: document.externalUrl,
      createdAt: document.createdAt
    }

    const current = documentsByProjectId.get(document.projectId) ?? []
    current.push(item)
    documentsByProjectId.set(document.projectId, current)
  })

  const [statsRow] = await db
    .select({
      totalProjects: sql<number>`count(*)`,
      projectsWithQuotePdf: sql<number>`coalesce(sum(case when coalesce(${documentsByProject.quoteTotal}, 0) > 0 then 1 else 0 end), 0)`,
      projectsWithInvoicePdf: sql<number>`coalesce(sum(case when coalesce(${documentsByProject.invoiceTotal}, 0) > 0 then 1 else 0 end), 0)`,
      documentsMissingLink: sql<number>`coalesce(sum((coalesce(${documentsByProject.quoteTotal}, 0) - coalesce(${documentsByProject.quoteWithLinkCount}, 0)) + (coalesce(${documentsByProject.invoiceTotal}, 0) - coalesce(${documentsByProject.invoiceWithLinkCount}, 0))), 0)`,
      completeProjects: sql<number>`coalesce(sum(case when coalesce(${documentsByProject.quoteTotal}, 0) > 0 and coalesce(${documentsByProject.quoteTotal}, 0) = coalesce(${documentsByProject.quoteWithLinkCount}, 0) and coalesce(${documentsByProject.invoiceTotal}, 0) > 0 and coalesce(${documentsByProject.invoiceTotal}, 0) = coalesce(${documentsByProject.invoiceWithLinkCount}, 0) then 1 else 0 end), 0)`
    })
    .from(projectsTable)
    .innerJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(documentsByProject, eq(documentsByProject.projectId, projectsTable.id))
    .where(whereClause)

  return {
    items: rows.map(row => buildBillingProjectStatus({
      project: {
        id: row.id,
        clientId: row.clientId,
        name: row.name,
        status: row.status,
        startDate: row.startDate,
        endDate: row.endDate,
        client: {
          id: row.clientEntityId,
          name: row.clientName
        }
      },
      quoteTotal: toNumber(row.quoteTotal),
      quoteWithLinkCount: toNumber(row.quoteWithLinkCount),
      invoiceTotal: toNumber(row.invoiceTotal),
      invoiceWithLinkCount: toNumber(row.invoiceWithLinkCount),
      documents: documentsByProjectId.get(row.id) ?? []
    })),
    projectOptions,
    stats: {
      totalProjects: toNumber(statsRow?.totalProjects),
      projectsWithQuotePdf: toNumber(statsRow?.projectsWithQuotePdf),
      projectsWithInvoicePdf: toNumber(statsRow?.projectsWithInvoicePdf),
      documentsMissingLink: toNumber(statsRow?.documentsMissingLink),
      completeProjects: toNumber(statsRow?.completeProjects)
    },
    pagination: {
      page,
      pageSize: query.pageSize,
      totalItems,
      totalPages
    }
  }
})
