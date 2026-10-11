import { createError, type H3Event } from 'h3'
import { and, desc, eq, isNull, ne, or, sql } from 'drizzle-orm'
import { db } from '~/db'
import { contactsTable } from '~/db/schema/contacts'
import { clientsTable } from '~/db/schema/clients'
import { projectBriefsTable } from '~/db/schema/project-briefs'
import { projectsTable } from '~/db/schema/projects'
import type { BriefEnrichmentStatus, BriefProjectType, BriefBudgetRange, BriefStatus, BriefTarget } from '~/constants/briefs'
import { getBriefDisplayStatus } from '~/lib/briefs'
import type { Brief, BriefListItem } from '~/types/brief'
import { buildBriefUrl, generateBriefToken } from '../lib/external-api'

export type BriefRow = typeof projectBriefsTable.$inferSelect
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export const getBriefSiteUrl = (event: H3Event) => {
  const briefSiteUrl = useRuntimeConfig(event).briefSiteUrl as string | undefined
  if (!briefSiteUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_BRIEF_SITE_URL n’est pas configuré : impossible de construire le lien du brief'
    })
  }
  return briefSiteUrl
}

const contactNameSql = sql<string | null>`nullif(trim(concat_ws(' ', ${contactsTable.firstName}, ${contactsTable.lastName})), '')`

const namesColumns = {
  contactName: contactNameSql,
  projectName: projectsTable.name
}

// La liste n'a besoin que des colonnes scalaires : answers, summary et enrichment (jsonb, jusqu'à
// 256 Ko) ne sont chargés que pour la fiche détaillée.
const briefListColumns = {
  id: projectBriefsTable.id,
  clientId: projectBriefsTable.clientId,
  projectId: projectBriefsTable.projectId,
  target: projectBriefsTable.target,
  contactId: projectBriefsTable.contactId,
  status: projectBriefsTable.status,
  token: projectBriefsTable.token,
  expiresAt: projectBriefsTable.expiresAt,
  openedAt: projectBriefsTable.openedAt,
  completedAt: projectBriefsTable.completedAt,
  createdAt: projectBriefsTable.createdAt,
  projectType: projectBriefsTable.projectType,
  budgetRange: projectBriefsTable.budgetRange
}

type BriefListRow = Pick<BriefRow, keyof typeof briefListColumns>

const toListItem = (row: BriefListRow, names: { contactName: string | null, projectName: string | null }, briefSiteUrl: string, now: Date): BriefListItem => ({
  id: row.id,
  clientId: row.clientId,
  projectId: row.projectId,
  projectName: names.projectName,
  target: row.target as BriefTarget,
  contactId: row.contactId,
  contactName: names.contactName,
  status: row.status as BriefStatus,
  displayStatus: getBriefDisplayStatus({ status: row.status as BriefStatus, expiresAt: row.expiresAt }, now),
  url: buildBriefUrl(briefSiteUrl, row.token),
  expiresAt: row.expiresAt.toISOString(),
  openedAt: row.openedAt?.toISOString() ?? null,
  completedAt: row.completedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  projectType: row.projectType as BriefProjectType | null,
  budgetRange: row.budgetRange as BriefBudgetRange | null
})

const toDetail = (row: BriefRow, names: { contactName: string | null, projectName: string | null }, briefSiteUrl: string): Brief => ({
  ...toListItem(row, names, briefSiteUrl, new Date()),
  formVersion: row.formVersion,
  deadline: row.deadline,
  domain: row.domain,
  summary: row.summary,
  answers: row.answers,
  enrichment: row.enrichment,
  enrichmentStatus: row.enrichmentStatus as BriefEnrichmentStatus | null,
  enrichedAt: row.enrichedAt?.toISOString() ?? null,
  appliedFields: row.appliedFields
})

// Ce que la fiche client montre hors des cartes projet : les briefs pas encore complétés (à relancer)
// et ceux complétés sans projet, repris d'avant le rattachement aux projets (à rattacher à la main).
export const listClientOpenBriefs = async (event: H3Event, clientId: number) => {
  const briefSiteUrl = getBriefSiteUrl(event)
  const now = new Date()
  const rows = await db
    .select({ brief: briefListColumns, ...namesColumns })
    .from(projectBriefsTable)
    .leftJoin(contactsTable, eq(projectBriefsTable.contactId, contactsTable.id))
    .leftJoin(projectsTable, eq(projectBriefsTable.projectId, projectsTable.id))
    .where(and(
      eq(projectBriefsTable.clientId, clientId),
      or(ne(projectBriefsTable.status, 'completed'), isNull(projectBriefsTable.projectId))
    ))
    .orderBy(desc(projectBriefsTable.createdAt), desc(projectBriefsTable.id))

  return rows.map(({ brief, ...names }) => toListItem(brief, names, briefSiteUrl, now))
}

const findBriefDetail = async (event: H3Event, condition: ReturnType<typeof eq>) => {
  const briefSiteUrl = getBriefSiteUrl(event)
  const [row] = await db
    .select({ brief: projectBriefsTable, ...namesColumns })
    .from(projectBriefsTable)
    .leftJoin(contactsTable, eq(projectBriefsTable.contactId, contactsTable.id))
    .leftJoin(projectsTable, eq(projectBriefsTable.projectId, projectsTable.id))
    .where(condition)

  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Brief non trouvé'
    })
  }

  const { brief, ...names } = row
  return toDetail(brief, names, briefSiteUrl)
}

export const getBriefDetail = (event: H3Event, id: number) => findBriefDetail(event, eq(projectBriefsTable.id, id))

export const getProjectBriefDetail = (event: H3Event, projectId: number) => findBriefDetail(event, eq(projectBriefsTable.projectId, projectId))

export const findBriefOrThrow = async (id: number) => {
  const [brief] = await db
    .select({ id: projectBriefsTable.id, clientId: projectBriefsTable.clientId, projectId: projectBriefsTable.projectId })
    .from(projectBriefsTable)
    .where(eq(projectBriefsTable.id, id))
  if (!brief) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Brief non trouvé'
    })
  }
  return brief
}

export const assertClientExists = async (clientId: number) => {
  const [client] = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.id, clientId))
  if (!client) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Client non trouvé'
    })
  }
}

// Un brief ne peut viser qu'un projet de son propre client, qui n'a pas déjà de brief (un projet a
// au plus un brief - l'index unique le garantit aussi, ceci donne une erreur lisible).
export const assertProjectCanReceiveBrief = async (clientId: number, projectId: number) => {
  const [project] = await db
    .select({ id: projectsTable.id, briefId: projectBriefsTable.id })
    .from(projectsTable)
    .leftJoin(projectBriefsTable, eq(projectBriefsTable.projectId, projectsTable.id))
    .where(and(eq(projectsTable.id, projectId), eq(projectsTable.clientId, clientId)))

  if (!project) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ce projet n’appartient pas à ce client'
    })
  }
  if (project.briefId) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ce projet a déjà un brief'
    })
  }
}

// Un projet qui change de client emporte son brief, mais rien de ce qui reliait le brief à l'ancien
// client ne doit survivre : son contact destinataire est détaché, et un lien encore en attente est
// remplacé - sinon l'ancien destinataire, qui l'a reçu, verrait au préremplissage le nom et les
// réponses techniques du nouveau client. Le nouveau lien est à renvoyer depuis la fiche du contact.
export const transferProjectBriefToClient = async (tx: Transaction, projectId: number, clientId: number) => {
  await tx.update(projectBriefsTable)
    .set({ clientId, contactId: null, updatedAt: new Date() })
    .where(and(eq(projectBriefsTable.projectId, projectId), eq(projectBriefsTable.status, 'completed')))

  await tx.update(projectBriefsTable)
    .set({ clientId, contactId: null, token: generateBriefToken(), status: 'sent', openedAt: null, updatedAt: new Date() })
    .where(and(eq(projectBriefsTable.projectId, projectId), ne(projectBriefsTable.status, 'completed')))
}
