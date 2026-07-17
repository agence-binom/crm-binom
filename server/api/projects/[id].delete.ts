import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { projectsTable } from '~/db/schema/projects'
import { projectIdSchema } from '~/validation/projects'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, projectIdSchema.parse)

  const [existingProject] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, id))

  if (!existingProject) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Projet non trouvé'
    })
  }

  if (!existingProject.archived) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Archivez le projet avant de le supprimer définitivement'
    })
  }

  await db.delete(projectsTable).where(eq(projectsTable.id, id))

  setResponseStatus(event, 204)
  return null
})
