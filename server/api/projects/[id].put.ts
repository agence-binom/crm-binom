import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { projectsTable } from '~/db/schema/projects'
import { getProjectDisplayStatus } from '~/lib/projects'
import { projectIdSchema, projectUpdateSchema } from '~/validation/projects'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, projectIdSchema.parse)
  const body = await readValidatedBody(event, projectUpdateSchema.parse)

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

  const nextProjectState = {
    ...existingProject,
    ...body
  }

  const [project] = await db
    .update(projectsTable)
    .set({
      ...body,
      status: getProjectDisplayStatus(nextProjectState),
      updatedAt: new Date()
    })
    .where(eq(projectsTable.id, id))
    .returning()

  return project
})
