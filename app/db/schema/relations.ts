import { relations } from 'drizzle-orm'
import { clientsTable } from './clients'
import { contactsTable } from './contacts'
import { projectsTable } from './projects'
import { tasksTable } from './tasks'
import { usersTable } from './users'
import { quotesTable } from './quotes'
import { invoicesTable } from './invoices'
import { paymentsTable } from './payments'

export const clientsRelations = relations(clientsTable, ({ many }) => ({
  contacts: many(contactsTable),
  projects: many(projectsTable),
  quotes: many(quotesTable),
  invoices: many(invoicesTable)
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
  quotes: many(quotesTable),
  invoices: many(invoicesTable)
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

export const quotesRelations = relations(quotesTable, ({ one, many }) => ({
  client: one(clientsTable, {
    fields: [quotesTable.clientId],
    references: [clientsTable.id]
  }),
  project: one(projectsTable, {
    fields: [quotesTable.projectId],
    references: [projectsTable.id]
  }),
  invoices: many(invoicesTable)
}))

export const invoicesRelations = relations(invoicesTable, ({ one, many }) => ({
  client: one(clientsTable, {
    fields: [invoicesTable.clientId],
    references: [clientsTable.id]
  }),
  project: one(projectsTable, {
    fields: [invoicesTable.projectId],
    references: [projectsTable.id]
  }),
  quote: one(quotesTable, {
    fields: [invoicesTable.quoteId],
    references: [quotesTable.id]
  }),
  payments: many(paymentsTable)
}))

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  invoice: one(invoicesTable, {
    fields: [paymentsTable.invoiceId],
    references: [invoicesTable.id]
  })
}))
