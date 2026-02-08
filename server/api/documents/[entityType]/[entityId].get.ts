import { eq, and } from 'drizzle-orm'
import { db } from '~/db'
import { documentsTable } from '~/db/schema/documents'

export default defineEventHandler(async (event) => {
  const entityType = getRouterParam(event, 'entityType')
  const entityId = getRouterParam(event, 'entityId')

  if (!entityType || !entityId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Type et ID d\'entité requis'
    })
  }

  const documents = await db
    .select()
    .from(documentsTable)
    .where(
      and(
        eq(documentsTable.entityType, entityType),
        eq(documentsTable.entityId, parseInt(entityId))
      )
    )

  return { documents }
})
