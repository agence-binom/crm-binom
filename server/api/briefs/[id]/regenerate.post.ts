import { and, eq, ne } from 'drizzle-orm'
import { db } from '~/db'
import { projectBriefsTable } from '~/db/schema/project-briefs'
import { getBriefExpiresAt } from '~/lib/briefs'
import { briefIdSchema, briefRegenerateSchema } from '~/validation/briefs'
import { logActivity } from '~~/server/utils/activity-log'
import { findBriefOrThrow, getBriefDetail, getBriefSiteUrl } from '~~/server/utils/briefs'
import { generateBriefToken } from '~~/server/lib/external-api'

// Nouveau jeton = l'ancien lien cesse immédiatement de fonctionner (404 côté site). Le statut
// revient à 'sent' : le nouveau lien n'a encore été ouvert par personne.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, briefIdSchema.parse)
  const body = await readValidatedBody(event, payload => briefRegenerateSchema.parse(payload ?? {}))
  getBriefSiteUrl(event)

  await findBriefOrThrow(id)

  const [regenerated] = await db.update(projectBriefsTable)
    .set({
      token: generateBriefToken(),
      status: 'sent',
      openedAt: null,
      expiresAt: getBriefExpiresAt(body.expiresInDays),
      updatedAt: new Date()
    })
    .where(and(eq(projectBriefsTable.id, id), ne(projectBriefsTable.status, 'completed')))
    .returning({ id: projectBriefsTable.id })

  if (!regenerated) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ce brief a déjà été complété : envoyez un nouveau brief plutôt que de régénérer ce lien'
    })
  }

  void logActivity(event, { entityType: 'brief', entityId: id, action: 'update', metadata: { regenerated: true } })

  return getBriefDetail(event, id)
})
