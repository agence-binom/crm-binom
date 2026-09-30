import { db } from '~/db'
import { projectNotesTable } from '~/db/schema/project-notes'
import { extractProjectNoteText } from '~/lib/project-notes'
import { projectIdSchema } from '~/validation/projects'
import { projectNoteCreateSchema } from '~/validation/project-notes'
import { getAppUser } from '~~/server/utils/auth'
import { assertProjectExists, assertProjectNoteBodyWithinLimit } from '~~/server/utils/project-notes'

export default defineEventHandler(async (event) => {
  const { id: projectId } = await getValidatedRouterParams(event, projectIdSchema.parse)
  assertProjectNoteBodyWithinLimit(event)
  // Corps vide accepté : le popover crée une note vierge avant que l'utilisateur ne tape quoi que ce soit.
  const body = await readValidatedBody(event, payload => projectNoteCreateSchema.parse(payload ?? {}))

  await assertProjectExists(projectId)

  const userId = getAppUser(event).id
  const now = new Date()
  const [note] = await db.insert(projectNotesTable).values({
    projectId,
    title: body.title ?? null,
    content: body.content ?? null,
    contentText: extractProjectNoteText(body.content),
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now
  }).returning()

  setResponseStatus(event, 201)
  return note
})
