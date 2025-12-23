import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable, projectsTable } from '~/db/schema'
import { clientIdSchema } from '~/db/schema/validation'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, clientIdSchema.parse)

  // Récupérer le client
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, id))

  if (!client) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Client non trouvé'
    })
  }

  // Récupérer les projets du client
  const projects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.clientId, id))

  return { client, projects }
})
