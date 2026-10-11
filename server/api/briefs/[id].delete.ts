import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { projectBriefsTable } from '~/db/schema/project-briefs'
import { briefIdSchema } from '~/validation/briefs'
import { logActivity } from '~~/server/utils/activity-log'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, briefIdSchema.parse)

  const [deleted] = await db.delete(projectBriefsTable)
    .where(eq(projectBriefsTable.id, id))
    .returning({ id: projectBriefsTable.id, clientId: projectBriefsTable.clientId })

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Brief non trouvé'
    })
  }

  void logActivity(event, { entityType: 'brief', entityId: id, action: 'delete', metadata: { clientId: deleted.clientId } })

  setResponseStatus(event, 204)
  return null
})
