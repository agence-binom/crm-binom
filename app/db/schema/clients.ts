import { boolean, integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { usersTable } from './users'

export const clientsTable = pgTable('clients', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 50 }),
  address: text(),
  city: varchar({ length: 100 }),
  postalCode: varchar({ length: 5 }),
  country: varchar({ length: 100 }),
  website: varchar({ length: 255 }),
  siret: varchar({ length: 14 }),
  notes: text(),
  icon: varchar({ length: 100 }),
  archived: boolean().notNull().default(false),
  description: text(),
  // Défaut 'client' au niveau DB uniquement pour backfiller les lignes existantes lors de la
  // migration (rien ne doit disparaître de /clients au déploiement) - les créations applicatives
  // passent toujours une valeur explicite (cf. clientCreateSchema, défaut 'nouveau').
  prospectionStatus: varchar({ length: 30 }).notNull().default('client'), // 'nouveau' | 'contacte' | 'a_relancer' | 'devis_envoye' | 'negociation' | 'client' | 'perdu'
  createdBy: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  updatedBy: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}).enableRLS()
