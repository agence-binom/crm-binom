import { sql } from 'drizzle-orm'
import { check, index, integer, pgTable, timestamp, uniqueIndex, varchar, text } from 'drizzle-orm/pg-core'
import { documentsTable } from './documents'
import { projectsTable } from './projects'

// The business record for one billing step (Proposition commerciale / Devis / Facture d'acompte /
// Facture): its workflow status, business date, and Facture.net link - independent of whether a
// file has been attached yet. `documentId` is nullable and points at the actual uploaded file in
// `documentsTable` once one exists.
export const billingDocumentsTable = pgTable('billing_documents', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer().notNull().references(() => projectsTable.id, { onDelete: 'cascade' }),
  documentType: varchar({ length: 50 }).notNull(), // 'commercial_proposal' | 'quote' | 'invoice'
  subtype: varchar({ length: 20 }), // 'acompte' | 'solde' | 'unique' | 'avoir' (invoice only)
  status: varchar({ length: 20 }).notNull().default('draft'), // 'draft' | 'sent' | 'completed' | 'cancelled' | 'refused' | 'non_applicable'
  statusDate: timestamp(), // Business date tied to the current status (signature/paiement/règlement - label depends on documentType)
  externalUrl: varchar({ length: 2048 }), // Source page URL on Facture.net
  description: text(),
  documentId: integer().references(() => documentsTable.id, { onDelete: 'set null' }), // The attached file, if any - losing the file must not erase the billing history
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, table => [
  // A given file can back at most one billing step.
  uniqueIndex('billing_documents_document_id_unique').on(table.documentId).where(sql`${table.documentId} is not null`),
  index('billing_documents_project_lookup_idx').on(table.projectId, table.documentType, table.subtype, table.createdAt),
  check('billing_documents_subtype_invoice_only', sql`${table.subtype} is null or ${table.documentType} = 'invoice'`)
]).enableRLS()
