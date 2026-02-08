import { integer, pgTable, varchar, text, timestamp, decimal } from 'drizzle-orm/pg-core'
import { invoicesTable } from './invoices'

export const paymentsTable = pgTable('payments', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  invoiceId: integer().notNull().references(() => invoicesTable.id, { onDelete: 'cascade' }),
  amount: decimal({ precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp().notNull(),
  paymentMethod: varchar({ length: 50 }).notNull(), // bank_transfer, check, cash, credit_card, etc.
  type: varchar({ length: 50 }).notNull().default('payment'), // payment, deposit (acompte), refund
  reference: varchar({ length: 255 }), // Référence de transaction
  notes: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
