import { integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { projectsTable } from './projects'
import { usersTable } from './users'

export const tasksTable = pgTable('tasks', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer().references(() => projectsTable.id, { onDelete: 'cascade' }),
  assignedTo: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  title: varchar({ length: 255 }).notNull(),
  notes: text(),
  status: varchar({ length: 50 }).notNull().default('todo'), // 'todo' | 'in_progress' | 'waiting' | 'validation' | 'done'
  workflowTag: varchar({ length: 50 }),
  priority: varchar({ length: 50 }).notNull().default('low'), // 'low' | 'medium' | 'high'
  dueDate: timestamp(),
  startedAt: timestamp(),
  completedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
