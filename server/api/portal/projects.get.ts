import { and, asc, eq } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { db } from '~/db'
import type { clientsTable } from '~/db/schema/clients'
import { projectsTable } from '~/db/schema/projects'

// Le contact/client actifs sont déjà résolus et vérifiés par ../../middleware/01-auth.ts. La
// portée par clientId est ce qui garantit qu'un contact ne peut lister que les projets de son
// propre client - aucun endpoint ne doit accepter un projectId arbitraire sans repasser par cette
// liste (voir app/pages/espace-client/projets/[id].vue, qui résout le projet via ce endpoint).
export default defineEventHandler(async (event) => {
  const client = event.context.portalClient as InferSelectModel<typeof clientsTable>

  const projects = await db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      status: projectsTable.status
    })
    .from(projectsTable)
    .where(and(eq(projectsTable.clientId, client.id), eq(projectsTable.archived, false)))
    .orderBy(asc(projectsTable.name), asc(projectsTable.id))

  return { projects }
})
