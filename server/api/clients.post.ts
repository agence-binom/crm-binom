import { db } from '~/db/index'
import { clientsTable } from '~/db/schema/clients'
import { clientCreateSchema } from '~/validation/clients'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, clientCreateSchema.parse)

  const newClient = await db
    .insert(clientsTable)
    .values(body)
    .returning()

  return {
    message: 'Client créé',
    client: newClient[0]
  }
})
