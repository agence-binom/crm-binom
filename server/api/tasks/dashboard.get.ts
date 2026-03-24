import { asc } from 'drizzle-orm'
import { db } from '~/db'
import { projectsTable } from '~/db/schema/projects'
import { tasksTable } from '~/db/schema/tasks'
import { usersTable } from '~/db/schema/users'

export default defineEventHandler(async () => {
  const [tasks, users, projectOptions] = await Promise.all([
    db
      .select()
      .from(tasksTable)
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
        name: projectsTable.name
      })
      .from(projectsTable)
      .orderBy(asc(projectsTable.name), asc(projectsTable.id))
  ])

  return {
    tasks,
    users,
    projectOptions
  }
})
