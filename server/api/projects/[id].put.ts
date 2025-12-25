import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { projectsTable } from '~/db/schema/projects'
import { projectIdSchema, projectUpdateSchema } from '~/validation/projects'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, projectIdSchema.parse)
  const body = await readValidatedBody(event, projectUpdateSchema.parse)

  const [project] = await db
    .update(projectsTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(projectsTable.id, id))
    .returning()

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Projet non trouvé'
    })
  }

  return project
})
