import { integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'

// Pure file storage: a `documents` row always represents a real uploaded file, generically
// attachable to any entity (client, project, task, resource, or a billing_documents record via
// billingDocumentsTable.documentId). Billing-specific workflow state (status, dates, Facture.net
// link) lives on `billing_documents` instead — see app/db/schema/billing-documents.ts.
export const documentsTable = pgTable('documents', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  filename: varchar({ length: 255 }).notNull(), // Original filename
  filepath: varchar({ length: 500 }).notNull(), // Storage path
  mimetype: varchar({ length: 100 }).notNull(), // application/pdf, image/png, etc.
  size: integer().notNull(), // Size in bytes
  entityType: varchar({ length: 50 }).notNull(), // 'project', 'client', 'task', 'resource', etc.
  entityId: integer().notNull(), // Related entity ID
  description: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}).enableRLS()
