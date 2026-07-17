import { db } from '~/db/index'
import { clientsTable } from '~/db/schema/clients'
import { contactsTable } from '~/db/schema/contacts'
import { projectsTable } from '~/db/schema/projects'
import { and, eq } from 'drizzle-orm'
import { clientIdSchema } from '~/validation/clients'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, clientIdSchema.parse)

  const existingClient = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, id))

  if (existingClient.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Client non trouvé'
    })
  }

  if (!existingClient[0]!.archived) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Archivez le client avant de le supprimer définitivement'
    })
  }

  const [activeProjects, activeContacts] = await Promise.all([
    db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(and(eq(projectsTable.clientId, id), eq(projectsTable.archived, false))),
    db
      .select({ id: contactsTable.id })
      .from(contactsTable)
      .where(and(eq(contactsTable.clientId, id), eq(contactsTable.archived, false)))
  ])

  if (activeProjects.length > 0 || activeContacts.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ce client a encore des projets ou contacts actifs. Archivez-les avant de supprimer le client.'
    })
  }

  await db
    .delete(clientsTable)
    .where(eq(clientsTable.id, id))

  setResponseStatus(event, 204)
  return null
})
