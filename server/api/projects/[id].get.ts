import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { projectsTable } from '~/db/schema'
import { projectIdSchema } from '~/db/schema/validation'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, projectIdSchema.parse)

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id))

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Projet non trouvé'
    })
  }

  return project
})
