import { and, eq } from 'drizzle-orm'
import { db } from '~/db'
import { contactsTable } from '~/db/schema/contacts'
import { projectBriefsTable } from '~/db/schema/project-briefs'
import { getBriefExpiresAt } from '~/lib/briefs'
import { briefCreateSchema } from '~/validation/briefs'
import { clientIdSchema } from '~/validation/clients'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'
import { assertClientExists, assertProjectCanReceiveBrief, getBriefDetail, getBriefSiteUrl } from '~~/server/utils/briefs'
import { generateBriefToken } from '~~/server/lib/external-api'

export default defineEventHandler(async (event) => {
  const { id: clientId } = await getValidatedRouterParams(event, clientIdSchema.parse)
  const body = await readValidatedBody(event, payload => briefCreateSchema.parse(payload ?? {}))
  // Échoue avant l'insert : un brief dont on ne peut pas construire le lien ne sert à rien.
  getBriefSiteUrl(event)

  await assertClientExists(clientId)

  if (body.contactId) {
    const [contact] = await db
      .select({ id: contactsTable.id })
      .from(contactsTable)
      .where(and(eq(contactsTable.id, body.contactId), eq(contactsTable.clientId, clientId)))
    if (!contact) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ce contact n’est pas rattaché à ce client'
      })
    }
  }

  if (body.projectId) await assertProjectCanReceiveBrief(clientId, body.projectId)

  const [brief] = await db.insert(projectBriefsTable).values({
    clientId,
    projectId: body.projectId ?? null,
    target: body.projectId ? 'existing_project' : 'new_project',
    contactId: body.contactId ?? null,
    token: generateBriefToken(),
    expiresAt: getBriefExpiresAt(body.expiresInDays),
    createdBy: getAppUser(event).id
  }).returning({ id: projectBriefsTable.id })

  void logActivity(event, { entityType: 'brief', entityId: brief!.id, action: 'create', metadata: { clientId, projectId: body.projectId ?? null } })

  setResponseStatus(event, 201)
  return getBriefDetail(event, brief!.id)
})
