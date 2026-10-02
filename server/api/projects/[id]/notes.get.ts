import { projectIdSchema } from '~/validation/projects'
import { projectNoteListQuerySchema } from '~/validation/project-notes'
import { assertProjectExists, getProjectNoteSummaries } from '~~/server/utils/project-notes'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, projectIdSchema.parse)
  const { q } = await getValidatedQuery(event, projectNoteListQuerySchema.parse)

  await assertProjectExists(id)

  return { notes: await getProjectNoteSummaries(id, q) }
})
