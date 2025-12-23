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
  postalCode: varchar({ length: 20 }),
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

export const clientsRelations = relations(clientsTable, ({ many }) => ({
  contacts: many(contactsTable)
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
