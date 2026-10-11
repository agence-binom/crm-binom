import { sql } from 'drizzle-orm'
import { date, index, integer, jsonb, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import type { BriefEnrichment, BriefSummary } from '../../types/brief'
import type { BriefAnswer } from '../../validation/briefs'
import { clientsTable } from './clients'
import { contactsTable } from './contacts'
import { projectsTable } from './projects'
import { usersTable } from './users'

// Brief pré-rendez-vous rempli par un prospect sur le site public (projet Astro), via les routes
// /api/external/briefs/* - voir docs/brief-api-contract.md. Un brief aboutit à un projet : soit il
// en crée un à sa réception (target 'new_project'), soit il complète un projet existant choisi à
// l'envoi. Tant qu'il n'est pas complété, il vit sur le client, sans projet vide créé d'avance.
export const projectBriefsTable = pgTable('project_briefs', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // Gardé même une fois le projet connu : un brief en attente n'a que son client. Resynchronisé
  // quand un projet change de client (server/api/projects/[id].put.ts).
  clientId: integer().notNull().references(() => clientsTable.id, { onDelete: 'cascade' }),
  // null tant qu'un brief 'new_project' n'est pas reçu, ou pour un brief repris d'avant le
  // rattachement aux projets que personne n'a encore rattaché (fiche client, « Brief à rattacher »).
  projectId: integer().references(() => projectsTable.id, { onDelete: 'cascade' }),
  target: varchar({ length: 20 }).notNull().default('new_project'), // 'new_project' | 'existing_project'
  contactId: integer().references(() => contactsTable.id, { onDelete: 'set null' }),
  // Stocké en clair (pas haché) pour pouvoir recopier le lien sans le régénérer - et donc sans
  // casser un lien déjà envoyé. Quiconque lit cette table lit déjà tout ce que le jeton protège.
  token: varchar({ length: 64 }).notNull().unique(),
  // 'expired' n'est jamais stocké, il se déduit de expiresAt (app/lib/briefs.ts).
  status: varchar({ length: 20 }).notNull().default('sent'), // 'sent' | 'opened' | 'completed'
  expiresAt: timestamp().notNull(),
  openedAt: timestamp(),
  completedAt: timestamp(),
  formVersion: varchar({ length: 50 }),
  // Payload intégral envoyé par le site, y compris les questions que le CRM ne connaît pas.
  answers: jsonb().$type<BriefAnswer[]>(),
  // Champs clés extraits de answers : le projet n'a ni type ni budget, ils ne vivent qu'ici.
  projectType: varchar({ length: 30 }), // 'showcase_site' | 'redesign' | 'ecommerce' | 'feature' | 'internal_tool' | 'other'
  budgetRange: varchar({ length: 20 }), // 'lt_3k' | '3k_6k' | '6k_12k' | '12k_25k' | 'gt_25k' | 'needs_advice'
  deadline: date(),
  domain: varchar({ length: 253 }),
  summary: jsonb().$type<BriefSummary>(),
  // Champs du projet existant remplis par le brief à sa réception (jamais un champ déjà saisi).
  appliedFields: jsonb().$type<string[]>(),
  enrichment: jsonb().$type<BriefEnrichment>(),
  enrichmentStatus: varchar({ length: 20 }), // 'pending' | 'done' | 'failed' | null (pas encore lancé)
  enrichedAt: timestamp(),
  notifiedAt: timestamp(),
  createdBy: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
}, table => [
  index('project_briefs_client_created_idx').on(table.clientId, table.createdAt.desc()),
  // Un projet a au plus un brief ; les briefs en attente (projectId null) ne sont pas concernés.
  uniqueIndex('project_briefs_project_unique').on(table.projectId).where(sql`${table.projectId} is not null`)
]).enableRLS()
