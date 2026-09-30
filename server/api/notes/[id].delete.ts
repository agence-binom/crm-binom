import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { projectNotesTable } from '~/db/schema/project-notes'
import { projectNoteIdSchema } from '~/validation/project-notes'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, projectNoteIdSchema.parse)

  const [deleted] = await db.delete(projectNotesTable).where(eq(projectNotesTable.id, id)).returning({ id: projectNotesTable.id })

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Note non trouvée'
    })
  }

  setResponseStatus(event, 204)
  return null
})
