import { db } from '~/db/index'
import { contactsTable, clientsTable } from '~/db/schema/index'
import { eq } from 'drizzle-orm'
import { clientIdSchema } from '~/db/schema/validation'

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

  const contacts = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.clientId, id))

  return {
    client: client[0],
    contacts
  }
})
