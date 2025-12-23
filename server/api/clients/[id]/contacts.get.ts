import { db } from '~/db/index'
import { contactsTable, clientsTable } from '~/db/schema/index'
import { eq } from 'drizzle-orm'
import { clientIdSchema } from '~/db/schema/validation'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, clientIdSchema.parse)

  // Vérifier que le client existe
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

  // Récupérer tous les contacts du client
  const contacts = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.clientId, id))

  return {
    client: client[0],
    contacts
  }
})
