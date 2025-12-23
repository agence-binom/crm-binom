import { db } from '~/db/index'
import { contactsTable } from '~/db/schema/index'

export default defineEventHandler(async () => {
  const allContacts = await db.select().from(contactsTable)

  return {
    contacts: allContacts
  }
})
