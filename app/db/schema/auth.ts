import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

// Tables Better Auth (remplace les tables auth.* gérées par Supabase). Noms de colonnes alignés
// sur les champs internes de Better Auth (voir @better-auth/core/db/schema) pour que
// drizzleAdapter les retrouve sans configuration de mapping supplémentaire.

export const authUserTable = pgTable('auth_user', {
  id: text().primaryKey(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  name: text().notNull(),
  image: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}).enableRLS()

export const authSessionTable = pgTable('auth_session', {
  id: text().primaryKey(),
  userId: text().notNull().references(() => authUserTable.id, { onDelete: 'cascade' }),
  token: text().notNull().unique(),
  expiresAt: timestamp().notNull(),
  ipAddress: text(),
  userAgent: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}).enableRLS()

export const authAccountTable = pgTable('auth_account', {
  id: text().primaryKey(),
  userId: text().notNull().references(() => authUserTable.id, { onDelete: 'cascade' }),
  providerId: text().notNull(),
  accountId: text().notNull(),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  password: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}).enableRLS()

export const authVerificationTable = pgTable('auth_verification', {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}).enableRLS()
