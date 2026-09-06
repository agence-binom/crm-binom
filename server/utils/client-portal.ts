import { createError, type H3Event } from 'h3'
import { and, eq, ne, sql } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { serverSupabaseServiceRole } from '#supabase/server'
import { db } from '~/db'
import { contactsTable } from '~/db/schema/contacts'
import { clientsTable } from '~/db/schema/clients'
import { projectsTable } from '~/db/schema/projects'
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

// `middleware/01-auth.ts` sets this on every /api/portal/* request - centralized here so the cast
// isn't repeated at every endpoint.
export const getPortalClient = (event: H3Event) => (
  event.context.portalClient as InferSelectModel<typeof clientsTable>
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
      eq(projectsTable.clientId, clientId),
      eq(projectsTable.archived, false)
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

export const getPortalServiceRoleClient = (event: H3Event) => {
  try {
    return serverSupabaseServiceRole(event)
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'L’accès portail requiert SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_KEY côté serveur'
    })
  }
}
