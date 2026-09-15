import { eq, sql } from 'drizzle-orm'
import { db } from '~/db'
import { usersTable } from '~/db/schema/users'

export const countAdmins = async () => {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.role, 'admin'))

  return row?.count ?? 0
}

// Empêche de se retrouver sans aucun admin (rétrogradation ou suppression du dernier) - sans ce
// garde-fou, plus personne ne pourrait gérer l'accès portail ni le journal d'activité, tous deux
// réservés aux admins.
export const wouldRemoveLastAdmin = async (targetUser: { role: string }) => {
  if (targetUser.role !== 'admin') return false

  return (await countAdmins()) <= 1
}
