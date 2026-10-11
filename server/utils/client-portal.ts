import { createError, type H3Event } from 'h3'
import { and, eq, ne, sql } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { db } from '~/db'
import { contactsTable } from '~/db/schema/contacts'
import { clientsTable } from '~/db/schema/clients'
import { projectsTable } from '~/db/schema/projects'
import { presaleProjectStatus } from '~/lib/projects'
import { normalizeEmailAddress } from '../lib/auth-users'

const UNAUTHORIZED_PORTAL_MESSAGE = 'Cette adresse email n’est pas autorisée à accéder à l’espace client.'

export const findActivePortalContactByEmail = async (email: string) => {
  const normalizedEmail = normalizeEmailAddress(email)
  const [contact] = await db
    .select()
    .from(contactsTable)
    .where(and(
      eq(contactsTable.portalStatus, 'active'),
      eq(contactsTable.archived, false),
      sql`lower(${contactsTable.email}) = ${normalizedEmail}`
    ))
    .limit(1)

  return contact ?? null
}

// Jointe en une seule requête (plutôt que contact puis client séparément) : les deux ne sont
// jamais nécessaires l'un sans l'autre pour l'espace client.
export const requireActivePortalContactWithClient = async (email?: string | null) => {
  if (!email) {
    throw createError({
      statusCode: 403,
      statusMessage: UNAUTHORIZED_PORTAL_MESSAGE
    })
  }

  const normalizedEmail = normalizeEmailAddress(email)
  const [row] = await db
    .select({ contact: contactsTable, client: clientsTable })
    .from(contactsTable)
    .innerJoin(clientsTable, eq(contactsTable.clientId, clientsTable.id))
    .where(and(
      eq(contactsTable.portalStatus, 'active'),
      eq(contactsTable.archived, false),
      sql`lower(${contactsTable.email}) = ${normalizedEmail}`
    ))
    .limit(1)

  if (!row) {
    throw createError({
      statusCode: 403,
      statusMessage: UNAUTHORIZED_PORTAL_MESSAGE
    })
  }

  return row
}

export const touchPortalContactLastLogin = async (contactId: number) => {
  await db
    .update(contactsTable)
    .set({ portalLastLoginAt: new Date() })
    .where(eq(contactsTable.id, contactId))
}

export const requireContactById = async (id: number) => {
  const [contact] = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.id, id))
    .limit(1)

  if (!contact) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Contact non trouvé'
    })
  }

  return contact
}

// Un email avec un accès portail doit être unique globalement (voir l'index partiel sur
// contactsTable) : deux contacts de clients différents ne doivent jamais partager un email actif,
// sinon la connexion résoudrait arbitrairement l'un des deux clients.
export const findConflictingPortalContact = async (email: string, excludeContactId: number) => {
  const normalizedEmail = normalizeEmailAddress(email)
  const [conflict] = await db
    .select()
    .from(contactsTable)
    .where(and(
      ne(contactsTable.id, excludeContactId),
      sql`${contactsTable.portalStatus} is not null`,
      sql`lower(${contactsTable.email}) = ${normalizedEmail}`
    ))
    .limit(1)

  return conflict ?? null
}

// `middleware/01-auth.ts` sets these on every /api/portal/* request - centralized here so the cast
// isn't repeated at every endpoint.
export const getPortalClient = (event: H3Event) => (
  event.context.portalClient as InferSelectModel<typeof clientsTable>
)

export const getPortalContact = (event: H3Event) => (
  event.context.portalContact as InferSelectModel<typeof contactsTable>
)

// Un projet en avant-vente (brief reçu, devis pas encore signé) est une discussion commerciale
// interne : un client qui revient avec un accès portail ne doit pas le voir. Seule source de cette
// règle pour la liste (api/portal/projects.get.ts) comme pour l'accès par id ci-dessous.
export const portalVisibleProjectCondition = (clientId: number) => and(
  eq(projectsTable.clientId, clientId),
  eq(projectsTable.archived, false),
  ne(projectsTable.status, presaleProjectStatus)
)

// Every portal endpoint scoped to a single project (resources, billing documents...) must call
// this before touching the projectId from the route/body - it's what stops a contact from reading
// or writing another client's project by guessing its id.
export const requirePortalProject = async (clientId: number, projectId: number) => {
  const [project] = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(and(
      eq(projectsTable.id, projectId),
      portalVisibleProjectCondition(clientId)
    ))
    .limit(1)

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Projet non trouvé'
    })
  }

  return project
}

// Une ressource appartenant au bon projet (voir requirePortalProject) n'est pas forcément
// modifiable par le contact courant : seul son auteur peut la modifier/supprimer, pas les autres
// contacts du même client. 404 plutôt que 403, comme requirePortalProject, pour ne pas révéler
// l'existence d'une ressource créée par quelqu'un d'autre.
export const requireOwnedPortalResource = <T extends { createdByContactId: number | null }>(resource: T, contactId: number): T => {
  if (resource.createdByContactId !== contactId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ressource non trouvée'
    })
  }

  return resource
}
