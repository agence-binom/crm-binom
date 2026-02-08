import { integer, pgTable, varchar, text, timestamp, decimal } from 'drizzle-orm/pg-core'
import { clientsTable } from './clients'
import { projectsTable } from './projects'

export const quotesTable = pgTable('quotes', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer().notNull().references(() => clientsTable.id, { onDelete: 'cascade' }),
  projectId: integer().references(() => projectsTable.id, { onDelete: 'set null' }),
  number: varchar({ length: 50 }).notNull().unique(), // Numéro de devis (ex: DEV-2026-001)
  status: varchar({ length: 50 }).notNull().default('draft'), // draft, sent, accepted, rejected, expired
  totalHT: decimal({ precision: 10, scale: 2 }).notNull().default('0'),
  totalTTC: decimal({ precision: 10, scale: 2 }).notNull().default('0'),
  vatRate: decimal({ precision: 5, scale: 2 }).notNull().default('20'), // Taux TVA en %
  issueDate: timestamp().notNull(),
  validUntil: timestamp(), // Date de validité du devis
  notes: text(),
  terms: text(), // Conditions générales
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
