import { asc, eq } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { contactsTable } from '~/db/schema/contacts'
import { projectsTable } from '~/db/schema/projects'
import { clientIdSchema } from '~/validation/clients'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, clientIdSchema.parse)

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, id))

  if (!client) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Client non trouvé'
    })
  }

  const [contacts, projects] = await Promise.all([
    db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.clientId, id))
      .orderBy(asc(contactsTable.lastName), asc(contactsTable.firstName), asc(contactsTable.id)),
    db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.clientId, id))
      .orderBy(asc(projectsTable.name), asc(projectsTable.id))
  ])

  return {
    client,
    contacts,
    projects
  }
})
