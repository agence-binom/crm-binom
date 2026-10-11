import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { projectBriefsTable } from '~/db/schema/project-briefs'
import { briefAttachSchema, briefIdSchema } from '~/validation/briefs'
import { logActivity } from '~~/server/utils/activity-log'
import { assertProjectCanReceiveBrief, findBriefOrThrow, getBriefDetail } from '~~/server/utils/briefs'

// Rattachement manuel d'un brief complété resté sans projet (reprise des briefs reçus avant le
// rattachement aux projets, quand le client avait plusieurs projets). Rien n'est recopié dans le
// projet : il existait avant le brief, ses champs sont les nôtres.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, briefIdSchema.parse)
  const { projectId } = await readValidatedBody(event, briefAttachSchema.parse)

  const brief = await findBriefOrThrow(id)
  if (brief.projectId) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ce brief est déjà rattaché à un projet'
    })
  }
  await assertProjectCanReceiveBrief(brief.clientId, projectId)

  await db.update(projectBriefsTable)
    .set({ projectId, target: 'existing_project', appliedFields: [], updatedAt: new Date() })
    .where(eq(projectBriefsTable.id, id))

  void logActivity(event, { entityType: 'brief', entityId: id, action: 'update', metadata: { projectId } })

  return getBriefDetail(event, id)
})
