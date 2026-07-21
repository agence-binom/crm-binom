import { integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { projectsTable } from './projects'

export const resourcesTable = pgTable('resources', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer().notNull().references(() => projectsTable.id, { onDelete: 'cascade' }),
  type: varchar({ length: 20 }).notNull(), // 'document' | 'link' | 'text'
  name: varchar({ length: 255 }).notNull(),
  description: text(),

  // document only
  filename: varchar({ length: 255 }),
  filepath: varchar({ length: 500 }),
  mimetype: varchar({ length: 100 }),
  size: integer(),

  // link only
  url: varchar({ length: 2048 }),

  // text only
  content: text(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}).enableRLS()
