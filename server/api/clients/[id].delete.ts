import { db } from '~/db/index'
import { clientsTable } from '~/db/schema/clients'
import { eq } from 'drizzle-orm'
import { clientIdSchema } from '~/validation/clients'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, clientIdSchema.parse)

  const existingClient = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, id))

  if (existingClient.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Client non trouvé'
    })
  }

  await db
    .delete(clientsTable)
    .where(eq(clientsTable.id, id))

  setResponseStatus(event, 204)
  return null
})
