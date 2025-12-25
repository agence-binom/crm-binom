import { db } from '~/db/index'
import { clientsTable } from '~/db/schema/clients'
import { eq } from 'drizzle-orm'
import { clientIdSchema } from '~/validation/clients'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, clientIdSchema.parse)

  const client = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, id))

  if (client.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Client non trouvé'
    })
  }

  return {
    client: client[0]
  }
})
