import { eq, sql } from 'drizzle-orm'
import { db } from '~/db'
import { activityLogTable } from '~/db/schema/activity-log'
import { activityLogQuerySchema } from '~/validation/activity-log'
import { canViewActivityLog } from '~~/server/lib/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  if (!canViewActivityLog(getAppUser(event).role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seuls les administrateurs peuvent consulter le journal d’activité'
    })
  }

  const query = await getValidatedQuery(event, activityLogQuerySchema.parse)

  const entries = await db
    .select()
    .from(activityLogTable)
    .where(query.entityType ? eq(activityLogTable.entityType, query.entityType) : undefined)
    .orderBy(sql`${activityLogTable.createdAt} DESC NULLS LAST`)
    .limit(query.limit)

  return { entries }
})
