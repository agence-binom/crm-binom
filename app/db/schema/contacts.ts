import { boolean, integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { clientsTable } from './clients'

export const contactsTable = pgTable('contacts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer().references(() => clientsTable.id, { onDelete: 'set null' }),
  firstName: varchar({ length: 100 }).notNull(),
  lastName: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 50 }),
  position: varchar({ length: 100 }),
  mobile: varchar({ length: 50 }),
  notes: text(),
  archived: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
