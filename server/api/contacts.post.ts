import { db } from '~/db/index'
import { contactsTable } from '~/db/schema/index'
import { contactCreateSchema } from '~/validation/contacts'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, contactCreateSchema.parse)

  const newContact = await db
    .insert(contactsTable)
    .values(body)
    .returning()

  return {
    message: 'Contact créé',
    contact: newContact[0]
  }
})
