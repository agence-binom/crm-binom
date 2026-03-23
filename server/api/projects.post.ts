import { db } from '~/db'
import { projectsTable } from '~/db/schema/projects'
import { getProjectDisplayStatus } from '~/lib/projects'
import { projectCreateSchema } from '~/validation/projects'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, projectCreateSchema.parse)
  const [project] = await db.insert(projectsTable).values({
    ...body,
    status: getProjectDisplayStatus(body)
  }).returning()
  return project
})
