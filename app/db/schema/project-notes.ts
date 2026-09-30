import { index, integer, jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { projectsTable } from './projects'
import { usersTable } from './users'

export const projectNotesTable = pgTable('project_notes', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer().notNull().references(() => projectsTable.id, { onDelete: 'cascade' }),
  title: varchar({ length: 255 }), // null → titre dérivé de la première ligne de contentText
  content: jsonb(), // document de l'éditeur (TipTap)
  contentText: text(),
  createdBy: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  updatedBy: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, table => [
  index('project_notes_project_updated_idx').on(table.projectId, table.updatedAt)
]).enableRLS()
