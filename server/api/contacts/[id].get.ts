import { db } from '~/db/index'
import { clientsTable } from '~/db/schema/clients'
import { contactsTable } from '~/db/schema/contacts'
import { eq } from 'drizzle-orm'
import { contactIdSchema } from '~/validation/contacts'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, contactIdSchema.parse)

  const [currentContact] = await db
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
    .where(eq(contactsTable.id, id))

  if (!currentContact) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Contact non trouvé'
    })
  }

  return {
    contact: {
      id: currentContact.id,
      clientId: currentContact.clientId,
      firstName: currentContact.firstName,
      lastName: currentContact.lastName,
      email: currentContact.email,
      phone: currentContact.phone,
      position: currentContact.position,
      mobile: currentContact.mobile,
      notes: currentContact.notes,
      client: currentContact.clientEntityId && currentContact.clientName
        ? {
            id: currentContact.clientEntityId,
            name: currentContact.clientName
          }
        : null
    }
  }
})
