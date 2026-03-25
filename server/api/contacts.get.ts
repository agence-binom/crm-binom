import { asc, eq } from 'drizzle-orm'
import { db } from '~/db/index'
import { clientsTable } from '~/db/schema/clients'
import { contactsTable } from '~/db/schema/contacts'

export default defineEventHandler(async () => {
  const allContacts = await db
    .select({
      id: contactsTable.id,
      clientId: contactsTable.clientId,
      firstName: contactsTable.firstName,
      lastName: contactsTable.lastName,
      email: contactsTable.email,
      phone: contactsTable.phone,
      position: contactsTable.position,
      mobile: contactsTable.mobile,
      notes: contactsTable.notes,
      clientEntityId: clientsTable.id,
      clientName: clientsTable.name
    })
    .from(contactsTable)
    .leftJoin(clientsTable, eq(contactsTable.clientId, clientsTable.id))
    .orderBy(asc(contactsTable.lastName), asc(contactsTable.firstName), asc(contactsTable.id))

  return {
    contacts: allContacts.map(contact => ({
      id: contact.id,
      clientId: contact.clientId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      position: contact.position,
      mobile: contact.mobile,
      notes: contact.notes,
      client: contact.clientEntityId && contact.clientName
        ? {
            id: contact.clientEntityId,
            name: contact.clientName
          }
        : null
    }))
  }
})
