import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { tasksTable } from './tasks'
import { usersTable } from './users'
import { projectsTable } from './projects'

export const timeEntriesTable = pgTable('time_entries', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer().references(() => tasksTable.id, { onDelete: 'set null' }),
  projectId: integer().references(() => projectsTable.id, { onDelete: 'set null' }),
  userId: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  notes: text(),
  duration: integer().notNull(), // Duration in minutes
  createdBy: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  updatedBy: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}).enableRLS()
