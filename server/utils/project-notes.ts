import { createError, getRequestHeader, type H3Event } from 'h3'
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '~/db'
import { projectNotesTable } from '~/db/schema/project-notes'
import { projectsTable } from '~/db/schema/projects'
import { usersTable } from '~/db/schema/users'
import { getProjectNoteDisplayTitle, getProjectNoteExcerpt } from '~/lib/project-notes'
import { projectNoteContentMaxBytes } from '~/validation/project-notes'

// Marge pour le titre, updatedAt et l'échappement JSON du document autour de content.
const JSON_BODY_OVERHEAD_BYTES = 64 * 1024
// La liste n'affiche qu'un aperçu : inutile de rapatrier le texte complet de chaque note.
const SUMMARY_TEXT_PREFIX_LENGTH = 1000

// Coupe court avant que h3 ne parse un corps démesuré. Un envoi sans Content-Length (chunked)
// passe ce filtre, mais reste borné par la limite de taille du schéma Zod.
export const assertProjectNoteBodyWithinLimit = (event: H3Event) => {
  const contentLength = Number(getRequestHeader(event, 'content-length'))
  if (contentLength > projectNoteContentMaxBytes + JSON_BODY_OVERHEAD_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: 'La note est trop volumineuse (1 Mo maximum)'
    })
  }
}

export const assertProjectExists = async (projectId: number) => {
  const [project] = await db.select({ id: projectsTable.id }).from(projectsTable).where(eq(projectsTable.id, projectId))
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Projet non trouvé'
    })
  }
}

export const findProjectNoteOrThrow = async (id: number) => {
  const [note] = await db.select().from(projectNotesTable).where(eq(projectNotesTable.id, id))
  if (!note) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Note non trouvée'
    })
  }

  return note
}

// Postgres stocke les timestamps à la microseconde (defaultNow()), une Date JS s'arrête à la
// milliseconde : comparer directement la valeur renvoyée au client produirait un faux conflit.
export const projectNoteUpdatedAtMatches = (updatedAt: string) => (
  sql`date_trunc('milliseconds', ${projectNotesTable.updatedAt}) = ${new Date(updatedAt).toISOString()}::timestamp`
)

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, match => `\\${match}`)

export const getProjectNoteSummaries = async (projectId: number, search?: string) => {
  const pattern = search ? `%${escapeLikePattern(search)}%` : null

  const rows = await db
    .select({
      id: projectNotesTable.id,
      projectId: projectNotesTable.projectId,
      title: projectNotesTable.title,
      contentText: sql<string | null>`left(${projectNotesTable.contentText}, ${SUMMARY_TEXT_PREFIX_LENGTH})`,
      authorName: usersTable.name,
      createdBy: projectNotesTable.createdBy,
      updatedBy: projectNotesTable.updatedBy,
      createdAt: projectNotesTable.createdAt,
      updatedAt: projectNotesTable.updatedAt
    })
    .from(projectNotesTable)
    .leftJoin(usersTable, eq(projectNotesTable.createdBy, usersTable.id))
    .where(and(
      eq(projectNotesTable.projectId, projectId),
      pattern ? or(ilike(projectNotesTable.title, pattern), ilike(projectNotesTable.contentText, pattern)) : undefined
    ))
    .orderBy(desc(projectNotesTable.updatedAt), desc(projectNotesTable.id))

  return rows.map(({ contentText, ...row }) => ({
    ...row,
    displayTitle: getProjectNoteDisplayTitle({ title: row.title, contentText }),
    excerpt: getProjectNoteExcerpt({ title: row.title, contentText })
  }))
}
