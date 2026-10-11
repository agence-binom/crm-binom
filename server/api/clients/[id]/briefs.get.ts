import { clientIdSchema } from '~/validation/clients'
import { listClientOpenBriefs } from '~~/server/utils/briefs'

// Les briefs complétés et rattachés s'affichent sur la carte de leur projet (clients/[id]/dashboard).
export default defineEventHandler(async (event) => {
  const { id: clientId } = await getValidatedRouterParams(event, clientIdSchema.parse)
  return { briefs: await listClientOpenBriefs(event, clientId) }
})
