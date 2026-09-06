import { deliverableListQuerySchema } from '~/validation/deliverables'
import { getProjectDeliverables } from '~~/server/utils/deliverables'

export default defineEventHandler(async (event) => {
  const query = deliverableListQuerySchema.parse(getQuery(event))

  return { deliverables: await getProjectDeliverables(event, query.projectId) }
})
