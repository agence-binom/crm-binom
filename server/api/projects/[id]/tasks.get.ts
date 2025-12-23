import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { projectsTable, tasksTable } from '~/db/schema'
import { projectIdSchema } from '~/db/schema/validation'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, projectIdSchema.parse)

  // Récupérer le projet
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id))

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Projet non trouvé'
    })
  }

  // Récupérer les tâches du projet
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.projectId, id))

  return { project, tasks }
})
