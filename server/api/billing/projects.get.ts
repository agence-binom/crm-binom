import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { db } from '~/db'
import { buildBillingProjectStatus, type BillingProjectDocument } from '~/lib/billing'
import { clientsTable } from '~/db/schema/clients'
import { documentsTable } from '~/db/schema/documents'
import { projectsTable } from '~/db/schema/projects'
import { billingDashboardQuerySchema, type BillingDashboardQuery } from '~/validation/billing'

const toNumber = (value: unknown) => Number(value ?? 0)

// A document is "current" if it's the most recent one within its lifecycle group: quotes/proposals form a
// single group per project (most recent wins), invoices are grouped by their effective subtype (an "acompte"
// and a "solde" are both current at once), and each "avoir" is its own group (it never supersedes/is
// superseded). This mirrors `annotateDocumentLifecycle` in app/lib/documents.ts — kept in sync manually since
// this SQL version only needs to answer "is there at least one current, linked document" across ALL projects
// for filtering/pagination, before any per-project document list is fetched.
const isCurrentDocumentSql = sql<boolean>`(
  row_number() over (
    partition by
      ${documentsTable.entityId},
      ${documentsTable.documentType},
      case
        when ${documentsTable.documentType} = 'invoice' and coalesce(${documentsTable.subtype}, 'unique') = 'avoir'
          then 'avoir-' || ${documentsTable.id}::text
        when ${documentsTable.documentType} = 'invoice'
          then coalesce(${documentsTable.subtype}, 'unique')
        else 'na'
      end
    order by ${documentsTable.createdAt} desc, ${documentsTable.id} desc
  ) = 1
)`

const buildDocumentLifecycleQuery = () => db
  .select({
    entityId: documentsTable.entityId,
    documentType: documentsTable.documentType,
    subtype: documentsTable.subtype,
    externalUrl: documentsTable.externalUrl,
    isCurrent: isCurrentDocumentSql.as('is_current')
  })
  .from(documentsTable)
  .where(and(
    eq(documentsTable.entityType, 'project'),
    inArray(documentsTable.documentType, ['quote', 'invoice', 'commercial_proposal'])
  ))
  .as('document_lifecycle')

const buildDocumentsByProjectQuery = () => {
  const documentLifecycle = buildDocumentLifecycleQuery()
  const hasLink = sql`coalesce(${documentLifecycle.externalUrl}, '') <> ''`
  // A lone "avoir" doesn't count as a current invoice for completeness purposes.
  const isCurrentInvoice = sql`${documentLifecycle.documentType} = 'invoice' and ${documentLifecycle.isCurrent} and coalesce(${documentLifecycle.subtype}, 'unique') <> 'avoir'`

  return db
    .select({
      projectId: documentLifecycle.entityId,
      quoteTotal: sql<number>`sum(case when ${documentLifecycle.documentType} = 'quote' then 1 else 0 end)`.as('quote_total'),
      invoiceTotal: sql<number>`sum(case when ${documentLifecycle.documentType} = 'invoice' then 1 else 0 end)`.as('invoice_total'),
      proposalTotal: sql<number>`sum(case when ${documentLifecycle.documentType} = 'commercial_proposal' then 1 else 0 end)`.as('proposal_total'),
      quoteCurrentTotal: sql<number>`sum(case when ${documentLifecycle.documentType} = 'quote' and ${documentLifecycle.isCurrent} then 1 else 0 end)`.as('quote_current_total'),
      quoteCurrentWithLinkCount: sql<number>`sum(case when ${documentLifecycle.documentType} = 'quote' and ${documentLifecycle.isCurrent} and ${hasLink} then 1 else 0 end)`.as('quote_current_with_link_count'),
      invoiceCurrentTotal: sql<number>`sum(case when ${isCurrentInvoice} then 1 else 0 end)`.as('invoice_current_total'),
      invoiceCurrentWithLinkCount: sql<number>`sum(case when ${isCurrentInvoice} and ${hasLink} then 1 else 0 end)`.as('invoice_current_with_link_count'),
      proposalCurrentTotal: sql<number>`sum(case when ${documentLifecycle.documentType} = 'commercial_proposal' and ${documentLifecycle.isCurrent} then 1 else 0 end)`.as('proposal_current_total')
    })
    .from(documentLifecycle)
    .groupBy(documentLifecycle.entityId)
    .as('documents_by_project')
}

const buildWhereClause = (
  query: BillingDashboardQuery,
  documentsByProject: ReturnType<typeof buildDocumentsByProjectQuery>
) => {
  const quoteCurrentTotal = sql<number>`coalesce(${documentsByProject.quoteCurrentTotal}, 0)`
  const quoteCurrentWithLinkCount = sql<number>`coalesce(${documentsByProject.quoteCurrentWithLinkCount}, 0)`
  const invoiceCurrentTotal = sql<number>`coalesce(${documentsByProject.invoiceCurrentTotal}, 0)`
  const invoiceCurrentWithLinkCount = sql<number>`coalesce(${documentsByProject.invoiceCurrentWithLinkCount}, 0)`
  const proposalCurrentTotal = sql<number>`coalesce(${documentsByProject.proposalCurrentTotal}, 0)`
  const missingLinkCount = sql<number>`(${quoteCurrentTotal} - ${quoteCurrentWithLinkCount}) + (${invoiceCurrentTotal} - ${invoiceCurrentWithLinkCount})`
  const isCompleteCondition = sql`${quoteCurrentTotal} > 0 and ${quoteCurrentTotal} = ${quoteCurrentWithLinkCount} and ${invoiceCurrentTotal} > 0 and ${invoiceCurrentTotal} = ${invoiceCurrentWithLinkCount} and ${proposalCurrentTotal} > 0`

  const filters = []
  filters.push(eq(projectsTable.archived, false))

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
    case 'incomplete':
      filters.push(sql`not (${isCompleteCondition})`)
      break
    case 'missing_quote_pdf':
      filters.push(sql`${quoteCurrentTotal} = 0`)
      break
    case 'missing_invoice_pdf':
      filters.push(sql`${invoiceCurrentTotal} = 0`)
      break
    case 'missing_proposal_pdf':
      filters.push(sql`${proposalCurrentTotal} = 0`)
      break
    case 'missing_facturenet_link':
      filters.push(sql`${missingLinkCount} > 0`)
      break
    case 'complete':
      filters.push(isCompleteCondition)
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
    .where(eq(projectsTable.archived, false))
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
      invoiceTotal: sql<number>`coalesce(${documentsByProject.invoiceTotal}, 0)`,
      proposalTotal: sql<number>`coalesce(${documentsByProject.proposalTotal}, 0)`
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
          status: documentsTable.status,
          subtype: documentsTable.subtype,
          externalUrl: documentsTable.externalUrl,
          createdAt: documentsTable.createdAt
        })
        .from(documentsTable)
        .where(and(
          eq(documentsTable.entityType, 'project'),
          inArray(documentsTable.entityId, projectIds),
          inArray(documentsTable.documentType, ['quote', 'invoice', 'commercial_proposal'])
        ))
        .orderBy(asc(documentsTable.entityId), asc(documentsTable.documentType), desc(documentsTable.createdAt), desc(documentsTable.id))
    : []

  const documentsByProjectId = new Map<number, BillingProjectDocument[]>()

  documents.forEach((document) => {
    const item: BillingProjectDocument = {
      id: document.id,
      projectId: document.projectId,
      name: document.name,
      type: document.type as 'quote' | 'invoice' | 'commercial_proposal',
      status: document.status as 'draft' | 'sent' | 'completed',
      subtype: document.subtype,
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
      projectsWithQuotePdf: sql<number>`coalesce(sum(case when coalesce(${documentsByProject.quoteCurrentTotal}, 0) > 0 then 1 else 0 end), 0)`,
      projectsWithInvoicePdf: sql<number>`coalesce(sum(case when coalesce(${documentsByProject.invoiceCurrentTotal}, 0) > 0 then 1 else 0 end), 0)`,
      projectsWithProposalPdf: sql<number>`coalesce(sum(case when coalesce(${documentsByProject.proposalCurrentTotal}, 0) > 0 then 1 else 0 end), 0)`,
      documentsMissingLink: sql<number>`coalesce(sum((coalesce(${documentsByProject.quoteCurrentTotal}, 0) - coalesce(${documentsByProject.quoteCurrentWithLinkCount}, 0)) + (coalesce(${documentsByProject.invoiceCurrentTotal}, 0) - coalesce(${documentsByProject.invoiceCurrentWithLinkCount}, 0))), 0)`,
      completeProjects: sql<number>`coalesce(sum(case when coalesce(${documentsByProject.quoteCurrentTotal}, 0) > 0 and coalesce(${documentsByProject.quoteCurrentTotal}, 0) = coalesce(${documentsByProject.quoteCurrentWithLinkCount}, 0) and coalesce(${documentsByProject.invoiceCurrentTotal}, 0) > 0 and coalesce(${documentsByProject.invoiceCurrentTotal}, 0) = coalesce(${documentsByProject.invoiceCurrentWithLinkCount}, 0) and coalesce(${documentsByProject.proposalCurrentTotal}, 0) > 0 then 1 else 0 end), 0)`
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
      invoiceTotal: toNumber(row.invoiceTotal),
      proposalTotal: toNumber(row.proposalTotal),
      documents: documentsByProjectId.get(row.id) ?? []
    })),
    projectOptions,
    stats: {
      totalProjects: toNumber(statsRow?.totalProjects),
      projectsWithQuotePdf: toNumber(statsRow?.projectsWithQuotePdf),
      projectsWithInvoicePdf: toNumber(statsRow?.projectsWithInvoicePdf),
      projectsWithProposalPdf: toNumber(statsRow?.projectsWithProposalPdf),
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
