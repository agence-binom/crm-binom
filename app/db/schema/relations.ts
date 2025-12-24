import { relations } from 'drizzle-orm'
import { clientsTable } from './clients'
import { contactsTable } from './contacts'
import { projectsTable } from './projects'
import { tasksTable } from './tasks'
import { usersTable } from './users'

export const clientsRelations = relations(clientsTable, ({ many }) => ({
  contacts: many(contactsTable),
  projects: many(projectsTable)
}))

export const contactsRelations = relations(contactsTable, ({ one }) => ({
  client: one(clientsTable, {
    fields: [contactsTable.clientId],
    references: [clientsTable.id]
  }),
  user: one(usersTable, {
    fields: [contactsTable.userId],
    references: [usersTable.id]
  })
}))

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  client: one(clientsTable, {
    fields: [projectsTable.clientId],
    references: [clientsTable.id]
  }),
  tasks: many(tasksTable)
}))

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [tasksTable.projectId],
    references: [projectsTable.id]
  }),
  assignee: one(usersTable, {
    fields: [tasksTable.assignedTo],
    references: [usersTable.id]
  })
}))
