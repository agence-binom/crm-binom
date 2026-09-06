import type { H3Event } from 'h3'
import { db } from '~/db'
import { activityLogTable } from '~/db/schema/activity-log'
import type { ActivityAction, ActivityEntityType } from '~/validation/activity-log'

type ActorAppUser = { id: number, name: string }
type ActorPortalContact = { id: number, firstName: string, lastName: string }

// Appelé en fin de handler, après un insert/update/delete réussi. Déduit l'acteur depuis
// event.context (appUser côté agence, portalContact côté espace client) plutôt que de le faire
// répéter à chaque appel - voir server/middleware/01-auth.ts qui pose ces deux contextes.
//
// Le journal est un best-effort : une écriture ratée ici (ex. contrainte de clé étrangère sur un
// acteur qui vient d'être supprimé dans le même handler) ne doit jamais faire échouer une mutation
// déjà effectuée avec succès, au risque de renvoyer un 500 qui inciterait à retenter une création
// déjà commitée. Pour la même raison, les appelants ne doivent pas `await` cet appel : la réponse
// HTTP ne doit pas attendre sur une écriture dont l'échec est de toute façon ignoré (appeler avec
// `void logActivity(...)`) - sauf si un handler supprime l'acteur dans le même appel (voir
// server/api/users/[id].delete.ts), où l'écriture doit être garantie avant que le FK ne soit cassé.
export const logActivity = async (event: H3Event, params: {
  entityType: ActivityEntityType
  entityId: number
  action: ActivityAction
  metadata?: Record<string, unknown>
}) => {
  const appUser = event.context.appUser as ActorAppUser | undefined
  const portalContact = event.context.portalContact as ActorPortalContact | undefined

  if (!appUser && !portalContact) return

  const actorName = appUser ? appUser.name : `${portalContact!.firstName} ${portalContact!.lastName}`

  try {
    await db.insert(activityLogTable).values({
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorType: appUser ? 'user' : 'contact',
      actorUserId: appUser?.id ?? null,
      actorContactId: portalContact?.id ?? null,
      actorName,
      metadata: params.metadata ?? null
    })
  } catch (error) {
    console.error('Échec de l’écriture du journal d’activité', error)
  }
}
