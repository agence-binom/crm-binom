import { integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const documentsTable = pgTable('documents', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  filename: varchar({ length: 255 }).notNull(), // Nom du fichier original
  filepath: varchar({ length: 500 }).notNull(), // Chemin de stockage
  mimetype: varchar({ length: 100 }).notNull(), // application/pdf, image/png, etc.
  size: integer().notNull(), // Taille en bytes
  entityType: varchar({ length: 50 }).notNull(), // 'quote', 'invoice', 'project', 'client', etc.
  entityId: integer().notNull(), // ID de l'entité liée
  documentType: varchar({ length: 50 }), // 'quote' | 'invoice' pour les documents de facturation
  description: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
