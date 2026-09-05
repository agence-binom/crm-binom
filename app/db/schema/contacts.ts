import { sql } from 'drizzle-orm'
import { boolean, integer, pgTable, varchar, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { clientsTable } from './clients'

export const contactsTable = pgTable('contacts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer().references(() => clientsTable.id, { onDelete: 'set null' }),
  firstName: varchar({ length: 100 }).notNull(),
  lastName: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 50 }),
  position: varchar({ length: 100 }),
  mobile: varchar({ length: 50 }),
  notes: text(),
  archived: boolean().notNull().default(false),
  portalStatus: varchar({ length: 20 }), // 'active' | 'revoked' | null (jamais invité)
  portalLastLoginAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, table => [
  // Un email avec un accès portail (actif ou révoqué) doit être unique globalement, pas seulement
  // par client : sinon le même email pourrait être un contact portail actif pour deux clients à la
  // fois, et la connexion résoudrait arbitrairement l'un des deux (accès ambigu, pas cloisonné).
  uniqueIndex('contacts_portal_email_unique')
    .on(sql`lower(${table.email})`)
    .where(sql`${table.portalStatus} is not null`)
]).enableRLS()
