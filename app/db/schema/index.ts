import { integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 50 }).notNull().default('client'), // 'admin' | 'employee' | 'client'
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})

export const clientsTable = pgTable('clients', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 50 }),
  address: text(),
  city: varchar({ length: 100 }),
  postalCode: varchar({ length: 5 }),
  country: varchar({ length: 100 }),
  website: varchar({ length: 255 }),
  notes: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})

export const contactsTable = pgTable('contacts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer().notNull().references(() => clientsTable.id, { onDelete: 'cascade' }),
  userId: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  firstName: varchar({ length: 100 }).notNull(),
  lastName: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 50 }),
  position: varchar({ length: 100 }),
  mobile: varchar({ length: 50 }),
  notes: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})

export const projectsTable = pgTable('projects', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer().notNull().references(() => clientsTable.id, { onDelete: 'cascade' }),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  status: varchar({ length: 50 }).notNull().default('en_cours'),
  budget: integer(),
  startDate: timestamp(),
  endDate: timestamp(),
  url: varchar({ length: 255 }),
  notes: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})

export const tasksTable = pgTable('tasks', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer().references(() => projectsTable.id, { onDelete: 'cascade' }),
  assignedTo: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  status: varchar({ length: 50 }).notNull().default('todo'), // 'todo' | 'in_progress' | 'done'
  priority: varchar({ length: 50 }).notNull().default('medium'), // 'low' | 'medium' | 'high'
  dueDate: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})

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
