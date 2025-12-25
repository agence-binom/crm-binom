import { db } from '~/db/index'
import { clientsTable } from '~/db/schema/clients'

export default defineEventHandler(async () => {
  const allClients = await db.select().from(clientsTable)

  return {
    clients: allClients
  }
})
