import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { deliverablesTable } from '~/db/schema/deliverables'
import { deliverableIdSchema } from '~/validation/deliverables'
import { withDeliverablesDownloadUrls } from '~~/server/utils/deliverables'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, deliverableIdSchema.parse)

  const [deliverable] = await db.select().from(deliverablesTable).where(eq(deliverablesTable.id, id))

  if (!deliverable) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Livrable non trouvé'
    })
  }

  const [deliverableWithUrl] = await withDeliverablesDownloadUrls(event, [deliverable])
  return deliverableWithUrl
})
