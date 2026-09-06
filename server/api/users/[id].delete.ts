import { db } from '~/db/index'
import { usersTable } from '~/db/schema/users'
import { eq } from 'drizzle-orm'
import { userIdSchema } from '~/validation/users'
import { logActivity } from '~~/server/utils/activity-log'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, userIdSchema.parse)

  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))

  if (existingUser.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Utilisateur non trouvé'
    })
  }

  // Journalisé avant la suppression, et attendu (contrairement aux autres appels à logActivity) :
  // un admin peut supprimer son propre compte, auquel cas l'acteur (appUser) n'existerait plus pour
  // la contrainte de clé étrangère si l'écriture n'était pas garantie avant le DELETE ci-dessous.
  await logActivity(event, { entityType: 'user', entityId: id, action: 'delete', metadata: { name: existingUser[0]!.name } })

  await db
    .delete(usersTable)
    .where(eq(usersTable.id, id))

  setResponseStatus(event, 204)
  return null
})
