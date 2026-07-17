import { asc, eq } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { clientsDashboardQuerySchema } from '~/validation/clients'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, clientsDashboardQuerySchema.parse)

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
      archived: clientsTable.archived,
      description: clientsTable.description
    })
    .from(clientsTable)
    .orderBy(asc(clientsTable.name), asc(clientsTable.id))
    .where(eq(clientsTable.archived, query.archived))

  return {
    clients
  }
})
