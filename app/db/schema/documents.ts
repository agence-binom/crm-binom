import { integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const documentsTable = pgTable('documents', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  filename: varchar({ length: 255 }).notNull(), // Original filename
  filepath: varchar({ length: 500 }).notNull(), // Storage path
  externalUrl: varchar({ length: 2048 }), // Source page URL on Facture.net
  mimetype: varchar({ length: 100 }).notNull(), // application/pdf, image/png, etc.
  size: integer().notNull(), // Size in bytes
  entityType: varchar({ length: 50 }).notNull(), // 'quote', 'invoice', 'project', 'client', etc.
  entityId: integer().notNull(), // Related entity ID
  documentType: varchar({ length: 50 }), // 'quote' | 'invoice' for billing documents
  status: varchar({ length: 20 }).notNull().default('draft'), // 'draft' | 'sent' | 'completed'
  subtype: varchar({ length: 20 }), // 'acompte' | 'solde' | 'unique' | 'avoir' (invoice only)
  description: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}).enableRLS()
