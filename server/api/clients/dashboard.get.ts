import { asc } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'

export default defineEventHandler(async () => {
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
      description: clientsTable.description
    })
    .from(clientsTable)
    .orderBy(asc(clientsTable.name), asc(clientsTable.id))

  return {
    clients
  }
})
