import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { projectIdSchema } from '~/validation/projects'
import { projectsTable } from '~/db/schema/projects'
import { tasksTable } from '~/db/schema/tasks'

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
