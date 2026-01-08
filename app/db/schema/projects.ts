import { integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { clientsTable } from './clients'

export const projectsTable = pgTable('projects', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer().notNull().references(() => clientsTable.id, { onDelete: 'cascade' }),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  status: varchar({ length: 50 }).notNull().default('en_cours'),
  startDate: timestamp(),
  endDate: timestamp(),
  url: varchar({ length: 255 }),
  notes: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
