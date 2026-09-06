import { integer, pgTable, timestamp, unique } from 'drizzle-orm/pg-core'
import { tasksTable } from './tasks'
import { usersTable } from './users'

export const taskAssigneesTable = pgTable('task_assignees', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer().notNull().references(() => tasksTable.id, { onDelete: 'cascade' }),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp().notNull().defaultNow()
}, table => [
  unique().on(table.taskId, table.userId)
]).enableRLS()
