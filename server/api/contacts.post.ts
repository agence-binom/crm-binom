import { db } from '~/db/index'
import { contactsTable } from '~/db/schema/contacts'
import { contactCreateSchema } from '~/validation/contacts'
import { logActivity } from '~~/server/utils/activity-log'
import { getAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, contactCreateSchema.parse)

  const newContact = await db
    .insert(contactsTable)
    .values({ ...body, createdBy: getAppUser(event).id })
    .returning()

  void logActivity(event, { entityType: 'contact', entityId: newContact[0]!.id, action: 'create', metadata: { name: `${newContact[0]!.firstName} ${newContact[0]!.lastName}` } })

  return {
    message: 'Contact créé',
    contact: newContact[0]
  }
})
