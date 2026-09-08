import { createError, type H3Event } from 'h3'
import { desc, eq } from 'drizzle-orm'
import { db } from '~/db'
import { deliverablesTable } from '~/db/schema/deliverables'
import { getDeliverableValidationError } from '~~/server/lib/deliverables-upload'
import { withOptionalDocumentDownloadUrls } from '~~/server/utils/documents'

export const assertValidDeliverableFile = (file: File) => {
  const errorMessage = getDeliverableValidationError(file)
  if (errorMessage) {
    throw createError({
      statusCode: 400,
      statusMessage: errorMessage
    })
  }
}

export const withDeliverablesDownloadUrls = withOptionalDocumentDownloadUrls

export const getProjectDeliverables = async (event: H3Event, projectId?: number) => {
  const deliverables = await db
    .select()
    .from(deliverablesTable)
    .where(projectId ? eq(deliverablesTable.projectId, projectId) : undefined)
    .orderBy(desc(deliverablesTable.createdAt))

  return withDeliverablesDownloadUrls(event, deliverables)
}
