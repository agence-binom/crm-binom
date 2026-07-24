import { asc, eq } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { projectsTable } from '~/db/schema/projects'
import { tasksTable } from '~/db/schema/tasks'
import { usersTable } from '~/db/schema/users'
import { taskDashboardQuerySchema } from '~/validation/tasks'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, taskDashboardQuerySchema.parse)

  const [tasks, users, projectOptions] = await Promise.all([
    db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.workspace, query.workspace))
      .orderBy(asc(tasksTable.createdAt), asc(tasksTable.id)),
    db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role
      })
      .from(usersTable)
      .orderBy(asc(usersTable.name), asc(usersTable.id)),
    db
      .select({
        id: projectsTable.id,
        name: projectsTable.name,
        clientName: clientsTable.name,
        clientId: clientsTable.id
      })
      .from(projectsTable)
      .innerJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
      .orderBy(asc(projectsTable.name), asc(projectsTable.id))
  ])

  return {
    tasks,
    users,
    projectOptions
  }
})
