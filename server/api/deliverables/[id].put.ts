import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { deliverablesTable } from '~/db/schema/deliverables'
import { deliverableIdSchema, deliverableUpdateSchema } from '~/validation/deliverables'
import { withDeliverablesDownloadUrls } from '~~/server/utils/deliverables'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, deliverableIdSchema.parse)
  const body = await readValidatedBody(event, deliverableUpdateSchema.parse)

  const [deliverable] = await db
    .update(deliverablesTable)
    .set({ ...body, updatedBy: getAppUser(event).id, updatedAt: new Date() })
    .where(eq(deliverablesTable.id, id))
    .returning()

  if (!deliverable) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Livrable non trouvé'
    })
  }

  void logActivity(event, { entityType: 'deliverable', entityId: id, action: 'update', metadata: { name: deliverable.name } })

  const [deliverableWithUrl] = await withDeliverablesDownloadUrls(event, [deliverable])
  return deliverableWithUrl
})
