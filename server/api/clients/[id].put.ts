import { db } from '~/db/index'
import { clientsTable } from '~/db/schema/clients'
import { eq } from 'drizzle-orm'
import { clientUpdateSchema, clientIdSchema } from '~/validation/clients'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, clientIdSchema.parse)
  const body = await readValidatedBody(event, clientUpdateSchema.parse)

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

  const clientUpdated = await db
    .update(clientsTable)
    .set({ ...body, updatedBy: getAppUser(event).id, updatedAt: new Date() })
    .where(eq(clientsTable.id, id))
    .returning()

  void logActivity(event, { entityType: 'client', entityId: id, action: 'update', metadata: { name: clientUpdated[0]!.name } })

  return {
    message: 'Client modifié',
    client: clientUpdated[0]
  }
})
