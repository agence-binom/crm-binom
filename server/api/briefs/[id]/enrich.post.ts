import { briefIdSchema } from '~/validation/briefs'
import { runBriefEnrichment } from '~~/server/utils/brief-processing'
import { getBriefDetail } from '~~/server/utils/briefs'

// Relance manuelle (domaine corrigé sur la fiche, panne DNS passagère...). Attendue côté client :
// les sondes sont bornées à quelques secondes, et l'UI veut afficher le résultat directement.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, briefIdSchema.parse)
  // Brief inexistant : runBriefEnrichment ne fait rien et getBriefDetail lève le 404.
  await runBriefEnrichment(id)

  return getBriefDetail(event, id)
})
