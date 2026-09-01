import { relations } from 'drizzle-orm'
import { billingDocumentsTable } from './billing-documents'
import { clientsTable } from './clients'
import { contactsTable } from './contacts'
import { documentsTable } from './documents'
import { projectsTable } from './projects'
import { tasksTable } from './tasks'
import { resourcesTable } from './resources'
import { taskAttachmentsTable } from './task-attachments'
import { usersTable } from './users'

export const clientsRelations = relations(clientsTable, ({ many }) => ({
  contacts: many(contactsTable),
  projects: many(projectsTable)
}))

export const contactsRelations = relations(contactsTable, ({ one }) => ({
  client: one(clientsTable, {
    fields: [contactsTable.clientId],
    references: [clientsTable.id]
  })
}))

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  client: one(clientsTable, {
    fields: [projectsTable.clientId],
    references: [clientsTable.id]
  }),
  tasks: many(tasksTable),
  resources: many(resourcesTable),
  billingDocuments: many(billingDocumentsTable)
}))

export const billingDocumentsRelations = relations(billingDocumentsTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [billingDocumentsTable.projectId],
    references: [projectsTable.id]
  }),
  document: one(documentsTable, {
    fields: [billingDocumentsTable.documentId],
    references: [documentsTable.id]
  })
}))

export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [tasksTable.projectId],
    references: [projectsTable.id]
  }),
  assignee: one(usersTable, {
    fields: [tasksTable.assignedTo],
    references: [usersTable.id]
  }),
  attachments: many(taskAttachmentsTable)
}))

export const resourcesRelations = relations(resourcesTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [resourcesTable.projectId],
    references: [projectsTable.id]
  })
}))

export const taskAttachmentsRelations = relations(taskAttachmentsTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [taskAttachmentsTable.taskId],
    references: [tasksTable.id]
  })
}))
