import { projectNoteIdSchema } from '~/validation/project-notes'
import { findProjectNoteOrThrow } from '~~/server/utils/project-notes'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, projectNoteIdSchema.parse)

  return findProjectNoteOrThrow(id)
})
