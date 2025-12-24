import { integer, pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core'

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
  notes: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
