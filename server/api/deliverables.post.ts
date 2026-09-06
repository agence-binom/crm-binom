import { db } from '~/db'
import { deliverablesTable } from '~/db/schema/deliverables'
import { deliverableCreateSchema } from '~/validation/deliverables'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, deliverableCreateSchema.parse)

  const [deliverable] = await db.insert(deliverablesTable).values({
    projectId: body.projectId,
    type: body.type,
    name: body.name,
    description: body.description?.trim() || null,
    url: body.type === 'link' ? body.url : null,
    content: body.type === 'text' ? body.content : null
  }).returning()

  return { ...deliverable, downloadUrl: null }
})
