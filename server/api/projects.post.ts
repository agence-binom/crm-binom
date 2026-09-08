import { db } from '~/db'
import { projectsTable } from '~/db/schema/projects'
import { getProjectDisplayStatus } from '~/lib/projects'
import { projectCreateSchema } from '~/validation/projects'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, projectCreateSchema.parse)
  const [project] = await db.insert(projectsTable).values({
    ...body,
    status: getProjectDisplayStatus(body),
    createdBy: getAppUser(event).id
  }).returning()

  void logActivity(event, { entityType: 'project', entityId: project!.id, action: 'create', metadata: { name: project!.name } })

  return project
})
