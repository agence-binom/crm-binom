import { boolean, integer, pgTable, varchar, text, timestamp, json } from 'drizzle-orm/pg-core'
import { clientsTable } from './clients'
import { usersTable } from './users'

export const projectsTable = pgTable('projects', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer().notNull().references(() => clientsTable.id, { onDelete: 'cascade' }),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  // Dérivé des dates (app/lib/projects.ts), sauf 'annule' et 'avant_vente', posés explicitement.
  status: varchar({ length: 50 }).notNull().default('en_cours'), // 'en_cours' | 'termine' | 'en_attente' | 'annule' | 'sans_statut' | 'avant_vente'
  archived: boolean().notNull().default(false),
  requiresAcompte: boolean().notNull().default(true),
  startDate: timestamp(),
  endDate: timestamp(),
  url: varchar({ length: 255 }),
  notes: text(),
  links: json(),
  createdBy: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  updatedBy: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}).enableRLS()
