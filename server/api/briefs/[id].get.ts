import { briefIdSchema } from '~/validation/briefs'
import { getBriefDetail } from '~~/server/utils/briefs'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, briefIdSchema.parse)
  return getBriefDetail(event, id)
})
