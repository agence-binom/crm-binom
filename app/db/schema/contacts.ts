import { integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { clientsTable } from './clients'

export const contactsTable = pgTable('contacts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer().notNull().references(() => clientsTable.id, { onDelete: 'cascade' }),
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
