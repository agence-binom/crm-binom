import { and, eq } from 'drizzle-orm'
import { db } from '~/db'
import { projectNotesTable } from '~/db/schema/project-notes'
import { extractProjectNoteText } from '~/lib/project-notes'
import { projectNoteIdSchema, projectNoteUpdateSchema } from '~/validation/project-notes'
import { getAppUser } from '~~/server/utils/auth'
import { assertProjectNoteBodyWithinLimit, findProjectNoteOrThrow, projectNoteUpdatedAtMatches } from '~~/server/utils/project-notes'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, projectNoteIdSchema.parse)
  assertProjectNoteBodyWithinLimit(event)
  const body = await readValidatedBody(event, projectNoteUpdateSchema.parse)

  const changes: Partial<typeof projectNotesTable.$inferInsert> = {
    updatedBy: getAppUser(event).id,
    updatedAt: new Date()
  }
  if (body.title !== undefined) changes.title = body.title
  if (body.content !== undefined) {
    changes.content = body.content
    changes.contentText = extractProjectNoteText(body.content)
  }

  // Le contrôle de version est dans le WHERE de l'UPDATE lui-même : un SELECT préalable laisserait
  // une fenêtre où deux enregistrements concurrents passeraient tous les deux la vérification.
  const [note] = await db
    .update(projectNotesTable)
    .set(changes)
    .where(and(eq(projectNotesTable.id, id), projectNoteUpdatedAtMatches(body.updatedAt)))
    .returning()

  if (note) return note

  const currentNote = await findProjectNoteOrThrow(id)
  throw createError({
    statusCode: 409,
    statusMessage: 'La note a été modifiée entre-temps par quelqu\'un d\'autre',
    data: { note: currentNote }
  })
})
