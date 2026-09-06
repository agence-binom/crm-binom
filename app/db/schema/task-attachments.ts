import { integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { tasksTable } from './tasks'

export const taskAttachmentsTable = pgTable('task_attachments', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer().notNull().references(() => tasksTable.id, { onDelete: 'cascade' }),
  type: varchar({ length: 20 }).notNull(), // 'document' | 'link'
  name: varchar({ length: 255 }).notNull(),
  description: text(),

  // Document-only fields
  filename: varchar({ length: 255 }),
  filepath: varchar({ length: 500 }),
  mimetype: varchar({ length: 100 }),
  size: integer(),

  // Link-only field
  url: varchar({ length: 2048 }),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}).enableRLS()
