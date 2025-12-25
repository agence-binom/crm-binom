import { db } from '~/db'
import { projectsTable } from '~/db/schema/projects'

export default defineEventHandler(async () => {
  const projects = await db.select().from(projectsTable)
  return { projects }
})
