import { integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { projectsTable } from './projects'
import { usersTable } from './users'

export const deliverablesTable = pgTable('deliverables', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer().references(() => projectsTable.id, { onDelete: 'cascade' }),
  type: varchar({ length: 20 }).notNull(), // 'document' | 'link' | 'text'
  name: varchar({ length: 255 }).notNull(),
  description: text(),

  // Document-only fields
  filename: varchar({ length: 255 }),
  filepath: varchar({ length: 500 }),
  mimetype: varchar({ length: 100 }),
  size: integer(),

  // Link-only field
  url: varchar({ length: 2048 }),

  // Text-only field
  content: text(),

  createdBy: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  updatedBy: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}).enableRLS()
