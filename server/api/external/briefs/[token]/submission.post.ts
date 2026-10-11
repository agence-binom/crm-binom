import type { H3Event } from 'h3'
import { and, eq, gt, ne, sql } from 'drizzle-orm'
import { db } from '~/db'
import { projectBriefsTable } from '~/db/schema/project-briefs'
import type { BriefStatus } from '~/constants/briefs'
import { extractBriefKeyFields, getBriefLinkState } from '~/lib/briefs'
import { briefSubmissionSchema, briefTokenSchema } from '~/validation/briefs'
import { notifyBriefCompleted, runBriefEnrichment } from '~~/server/utils/brief-processing'
import { attachCompletedBriefToProject } from '~~/server/utils/brief-reception'
import { briefLinkError } from '~~/server/utils/brief-link-errors'
import { toPublicDatabaseError } from '~~/server/utils/database-errors'
import { BodyTooLargeError, readLimitedBody } from '~~/server/lib/limited-body'

const MAX_BODY_BYTES = 256 * 1024

const payloadTooLarge = () => createError({
  statusCode: 413,
  statusMessage: 'Réponses trop volumineuses',
  data: { code: 'payload_too_large' }
})

const readSubmissionJson = async (event: H3Event) => {
  if (Number(getRequestHeader(event, 'content-length')) > MAX_BODY_BYTES) throw payloadTooLarge()

  let raw: Buffer
  try {
    raw = await readLimitedBody(event.node.req, MAX_BODY_BYTES)
  } catch (error) {
    if (error instanceof BodyTooLargeError) throw payloadTooLarge()
    throw error
  }

  try {
    return JSON.parse(raw.toString('utf8')) as unknown
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'JSON invalide' })
  }
}

export default defineEventHandler(async (event) => {
  const { token } = await getValidatedRouterParams(event, briefTokenSchema.parse)

  const parsed = briefSubmissionSchema.safeParse(await readSubmissionJson(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: { issues: parsed.error.issues } })
  }
  const body = parsed.data
  const { summary, projectType, budgetRange, deadline, domain } = extractBriefKeyFields(body.answers)
  const now = new Date()

  try {
    // Une seule requête décide de l'acceptation : deux envois simultanés du même lien ne peuvent pas
    // passer tous les deux - le second attend le verrou de ligne du premier, puis ne trouve plus de
    // brief 'non complété'. Le projet est créé (ou complété) dans la même transaction.
    const reception = await db.transaction(async (tx) => {
      const [completed] = await tx.update(projectBriefsTable)
        .set({
          status: 'completed',
          completedAt: now,
          openedAt: sql`coalesce(${projectBriefsTable.openedAt}, ${now.toISOString()}::timestamp)`,
          formVersion: body.formVersion,
          answers: body.answers,
          summary,
          projectType,
          budgetRange,
          deadline,
          domain,
          enrichmentStatus: 'pending',
          updatedAt: now
        })
        .where(and(
          eq(projectBriefsTable.token, token),
          ne(projectBriefsTable.status, 'completed'),
          gt(projectBriefsTable.expiresAt, now)
        ))
        .returning()

      if (!completed) return null

      const { projectId, created } = await attachCompletedBriefToProject(tx, completed)
      return { briefId: completed.id, projectId, created }
    })

    if (!reception) {
      const [existing] = await db
        .select({ status: projectBriefsTable.status, expiresAt: projectBriefsTable.expiresAt })
        .from(projectBriefsTable)
        .where(eq(projectBriefsTable.token, token))
      if (!existing) throw briefLinkError('not_found')

      const linkState = getBriefLinkState({ status: existing.status as BriefStatus, expiresAt: existing.expiresAt }, now)
      throw briefLinkError(linkState === 'completed' ? 'completed' : 'expired')
    }

    // Après la réponse : ni la lenteur d'un DNS ni une panne Resend ne doivent faire échouer (ou
    // retenter) une soumission déjà enregistrée. Les deux fonctions avalent leurs propres erreurs.
    const crmSiteUrl = useRuntimeConfig(event).public.siteUrl as string | undefined
    event.waitUntil(Promise.all([
      runBriefEnrichment(reception.briefId),
      notifyBriefCompleted(reception.briefId, crmSiteUrl)
    ]))

    setResponseStatus(event, 201)
    return { status: 'completed', completedAt: now.toISOString() }
  } catch (error) {
    throw toPublicDatabaseError(error)
  }
})
