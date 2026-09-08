import { z } from 'zod'

export const activityLogQuerySchema = z.object({
  entityType: z.string().max(50).optional(),
  limit: z.coerce.number().int().positive().max(500).optional().default(200)
})

export type ActivityLogQuery = z.infer<typeof activityLogQuerySchema>

// Seule source de vérité pour les types d'entité/action journalisés : partagée par logActivity
// (server/utils/activity-log.ts) et par l'affichage du journal (app/lib/activity-log.ts).
export const activityEntityTypes = ['client', 'contact', 'project', 'task', 'resource', 'document', 'billing_document', 'deliverable', 'task_attachment', 'user'] as const
export type ActivityEntityType = typeof activityEntityTypes[number]

export const activityActions = ['create', 'update', 'delete'] as const
export type ActivityAction = typeof activityActions[number]
