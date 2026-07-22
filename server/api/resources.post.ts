import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { resourceCreateSchema } from '~/validation/resources'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, resourceCreateSchema.parse)

  const [resource] = await db.insert(resourcesTable).values({
    projectId: body.projectId ?? null,
    taskId: body.taskId ?? null,
    type: body.type,
    name: body.name,
    description: body.description?.trim() || null,
    url: body.type === 'link' ? body.url : null,
    content: body.type === 'text' ? body.content : null
  }).returning()

  return { ...resource, downloadUrl: null }
})
