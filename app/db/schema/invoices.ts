import { integer, pgTable, varchar, text, timestamp, decimal } from 'drizzle-orm/pg-core'
import { clientsTable } from './clients'
import { projectsTable } from './projects'
import { quotesTable } from './quotes'

export const invoicesTable = pgTable('invoices', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer().notNull().references(() => clientsTable.id, { onDelete: 'cascade' }),
  projectId: integer().references(() => projectsTable.id, { onDelete: 'set null' }),
  quoteId: integer().references(() => quotesTable.id, { onDelete: 'set null' }), // Lien vers le devis si existant
  number: varchar({ length: 50 }).notNull().unique(), // Numéro de facture (ex: FAC-2026-001)
  status: varchar({ length: 50 }).notNull().default('draft'), // draft, sent, paid, partial, overdue, cancelled
  totalHT: decimal({ precision: 10, scale: 2 }).notNull().default('0'),
  totalTTC: decimal({ precision: 10, scale: 2 }).notNull().default('0'),
  vatRate: decimal({ precision: 5, scale: 2 }).notNull().default('20'),
  paidAmount: decimal({ precision: 10, scale: 2 }).notNull().default('0'), // Montant déjà payé
  issueDate: timestamp().notNull(),
  dueDate: timestamp().notNull(), // Date d'échéance
  paidDate: timestamp(), // Date de paiement complet
  notes: text(),
  terms: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
