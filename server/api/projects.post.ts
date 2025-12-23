import { db } from '~/db'
import { projectsTable } from '~/db/schema'
import { projectCreateSchema } from '~/db/schema/validation'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, projectCreateSchema.parse)
  const [project] = await db.insert(projectsTable).values(body).returning()
  return project
})
