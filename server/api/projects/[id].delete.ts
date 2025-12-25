import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { projectsTable } from '~/db/schema/projects'
import { projectIdSchema } from '~/validation/projects'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, projectIdSchema.parse)

  await db.delete(projectsTable).where(eq(projectsTable.id, id))

  setResponseStatus(event, 204)
  return null
})
