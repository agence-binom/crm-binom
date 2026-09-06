import { db } from '~/db/index'
import { clientsTable } from '~/db/schema/clients'
import { clientCreateSchema } from '~/validation/clients'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, clientCreateSchema.parse)

  const newClient = await db
    .insert(clientsTable)
    .values({ ...body, createdBy: getAppUser(event).id })
    .returning()

  void logActivity(event, { entityType: 'client', entityId: newClient[0]!.id, action: 'create', metadata: { name: newClient[0]!.name } })

  return {
    message: 'Client créé',
    client: newClient[0]
  }
})
