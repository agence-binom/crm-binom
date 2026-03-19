import { db } from '~/db'
import { documentsTable } from '~/db/schema/documents'
import { withDocumentsDownloadUrls } from '~~/server/utils/documents'

export default defineEventHandler(async (event) => {
  const documents = await db.select().from(documentsTable)
  return { documents: await withDocumentsDownloadUrls(event, documents) }
})
