import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { resourcesTable } from '~/db/schema/resources'
import { resourceIdSchema, resourceUpdateSchema } from '~/validation/resources'
import { withResourcesDownloadUrls } from '~~/server/utils/resources'
import { getPortalClient, getPortalContact, requireOwnedPortalResource, requirePortalProject } from '~~/server/utils/client-portal'
import { logActivity } from '~~/server/utils/activity-log'

export default defineEventHandler(async (event) => {
  const client = getPortalClient(event)
  const contact = getPortalContact(event)
  const { id } = await getValidatedRouterParams(event, resourceIdSchema.parse)
  const body = await readValidatedBody(event, resourceUpdateSchema.parse)

  const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id))

  if (!resource) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ressource non trouvée'
    })
  }

  await requirePortalProject(client.id, resource.projectId!)
  requireOwnedPortalResource(resource, contact.id)

  const [updated] = await db
    .update(resourcesTable)
    .set({ ...body, updatedByContactId: contact.id, updatedByUserId: null, updatedAt: new Date() })
    .where(eq(resourcesTable.id, id))
    .returning()

  void logActivity(event, { entityType: 'resource', entityId: id, action: 'update', metadata: { name: updated!.name } })

  const [resourceWithUrl] = await withResourcesDownloadUrls(event, [updated!])
  return resourceWithUrl
})
