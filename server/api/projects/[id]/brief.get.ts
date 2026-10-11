import { projectIdSchema } from '~/validation/projects'
import { getProjectBriefDetail } from '~~/server/utils/briefs'

// 404 quand le projet n'a pas de brief : c'est un cas normal (le brief est facultatif), l'UI le
// traite comme « aucun brief » et propose d'en envoyer un.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, projectIdSchema.parse)
  return getProjectBriefDetail(event, id)
})
