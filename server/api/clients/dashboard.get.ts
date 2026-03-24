import { asc, eq, sql } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { contactsTable } from '~/db/schema/contacts'
import { projectsTable } from '~/db/schema/projects'

const toNumber = (value: unknown) => Number(value ?? 0)

export default defineEventHandler(async () => {
  const contactsByClient = db
    .select({
      clientId: contactsTable.clientId,
      contactsCount: sql<number>`count(*)`
    })
    .from(contactsTable)
    .groupBy(contactsTable.clientId)
    .as('contacts_by_client')

  const projectsByClient = db
    .select({
      clientId: projectsTable.clientId,
      projectsCount: sql<number>`count(*)`
    })
    .from(projectsTable)
    .groupBy(projectsTable.clientId)
    .as('projects_by_client')

  const clients = await db
    .select({
      id: clientsTable.id,
      name: clientsTable.name,
      email: clientsTable.email,
      phone: clientsTable.phone,
      address: clientsTable.address,
      city: clientsTable.city,
      postalCode: clientsTable.postalCode,
      country: clientsTable.country,
      website: clientsTable.website,
      siret: clientsTable.siret,
      notes: clientsTable.notes,
      icon: clientsTable.icon,
      status: clientsTable.status,
      description: clientsTable.description,
      contactsCount: sql<number>`coalesce(${contactsByClient.contactsCount}, 0)`,
      projectsCount: sql<number>`coalesce(${projectsByClient.projectsCount}, 0)`
    })
    .from(clientsTable)
    .leftJoin(contactsByClient, eq(contactsByClient.clientId, clientsTable.id))
    .leftJoin(projectsByClient, eq(projectsByClient.clientId, clientsTable.id))
    .orderBy(asc(clientsTable.name), asc(clientsTable.id))

  return {
    clients: clients.map(client => ({
      ...client,
      contactsCount: toNumber(client.contactsCount),
      projectsCount: toNumber(client.projectsCount)
    }))
  }
})
