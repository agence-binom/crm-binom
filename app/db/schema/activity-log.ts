import { index, integer, json, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'
import { contactsTable } from './contacts'
import { usersTable } from './users'

// Journal d'activité agence : trace les créations/modifications/suppressions sur les entités
// principales du CRM, y compris les actions des contacts clients dans l'espace client. Polymorphe
// (entityType/entityId) sur le même principe que documentsTable, sans FK sur entityId : une
// suppression ne doit pas effacer sa propre trace, donc pas de cascade possible de toute façon.
export const activityLogTable = pgTable('activity_log', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  entityType: varchar({ length: 50 }).notNull(), // 'client' | 'contact' | 'project' | 'task' | 'resource' | 'document' | 'billing_document' | 'deliverable' | 'task_attachment'
  entityId: integer().notNull(),
  action: varchar({ length: 20 }).notNull(), // 'create' | 'update' | 'delete'
  actorType: varchar({ length: 20 }).notNull(), // 'user' | 'contact'
  actorUserId: integer().references(() => usersTable.id, { onDelete: 'set null' }),
  actorContactId: integer().references(() => contactsTable.id, { onDelete: 'set null' }),
  // Snapshot immuable du nom de l'acteur au moment de l'action : actorUserId/actorContactId
  // passent à null si l'acteur est supprimé plus tard, mais l'historique doit continuer à
  // afficher qui a agi plutôt que "Inconnu".
  actorName: varchar({ length: 255 }).notNull(),
  metadata: json(), // snapshot optionnel (ex: nom de l'entité au moment de l'action, utile après suppression)
  createdAt: timestamp().notNull().defaultNow()
}, table => [
  // Seul chemin de lecture aujourd'hui (GET /api/activity-log, page /agence/journal) : tri par
  // date, sans filtre - sans index, un tri décroissant force un scan complet dès que le journal
  // grossit. Le endpoint accepte déjà un filtre entityType (activityLogQuerySchema) pour une future
  // UI de filtrage, mais tant qu'aucune page ne l'utilise, un index composite (entityType, createdAt)
  // n'apporterait aucun bénéfice de lecture réel - juste un coût d'écriture sur chacune des ~40
  // routes qui journalisent. À ajouter si/quand ce filtre est exposé dans journal.vue.
  index('activity_log_created_at_idx').on(table.createdAt.desc())
]).enableRLS()
