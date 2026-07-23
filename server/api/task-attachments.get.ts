import { desc, eq } from 'drizzle-orm'
import { db } from '~/db'
import { taskAttachmentsTable } from '~/db/schema/task-attachments'
import { taskAttachmentListQuerySchema } from '~/validation/task-attachments'
import { withTaskAttachmentsDownloadUrls } from '~~/server/utils/task-attachments'

export default defineEventHandler(async (event) => {
  const query = taskAttachmentListQuerySchema.parse(getQuery(event))

  const attachments = await db
    .select()
    .from(taskAttachmentsTable)
    .where(eq(taskAttachmentsTable.taskId, query.taskId))
    .orderBy(desc(taskAttachmentsTable.createdAt))

  return { attachments: await withTaskAttachmentsDownloadUrls(event, attachments) }
})
