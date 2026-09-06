import { sql } from 'drizzle-orm'
import { check, integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { contactsTable } from './contacts'
import { projectsTable } from './projects'
import { usersTable } from './users'

// Seule table modifiable par un contact client (espace client) : l'auteur peut donc être un
// employé agence (usersTable) OU un contact client (contactsTable), jamais les deux à la fois -
// d'où deux paires de colonnes nullables plutôt qu'une seule FK partagée. Sert à limiter les
// droits d'un contact aux ressources qu'il a lui-même créées (voir server/utils/client-portal.ts).
export const resourcesTable = pgTable('resources', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer().references(() => projectsTable.id, { onDelete: 'cascade' }),
  type: varchar({ length: 20 }).notNull(), // 'document' | 'link' | 'text'
  name: varchar({ length: 255 }).notNull(),
  description: text(),

  // Document-only fields
  filename: varchar({ length: 255 }),
  filepath: varchar({ length: 500 }),
  mimetype: varchar({ length: 100 }),
  size: integer(),

  // Link-only field
  url: varchar({ length: 2048 }),

  // Text-only field
  content: text(),

  createdByUserId: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  createdByContactId: integer().references(() => contactsTable.id, { onDelete: 'set null' }),
  updatedByUserId: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  updatedByContactId: integer().references(() => contactsTable.id, { onDelete: 'set null' }),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, table => [
  check(
    'resources_created_by_single_actor',
    sql`${table.createdByUserId} is null or ${table.createdByContactId} is null`
  ),
  check(
    'resources_updated_by_single_actor',
    sql`${table.updatedByUserId} is null or ${table.updatedByContactId} is null`
  )
]).enableRLS()
