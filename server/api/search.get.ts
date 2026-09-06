import { and, asc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { contactsTable } from '~/db/schema/contacts'
import { projectsTable } from '~/db/schema/projects'
import { globalSearchQuerySchema } from '~/validation/search'

const SEARCH_RESULT_LIMIT = 6

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, globalSearchQuerySchema.parse)
  const pattern = `%${query.q}%`

  const [clients, projects, contacts] = await Promise.all([
    db.select({
      id: clientsTable.id,
      name: clientsTable.name
    })
      .from(clientsTable)
      .where(and(eq(clientsTable.archived, false), ilike(clientsTable.name, pattern)))
      .orderBy(asc(clientsTable.name), asc(clientsTable.id))
      .limit(SEARCH_RESULT_LIMIT),

    db.select({
      id: projectsTable.id,
      name: projectsTable.name,
      clientId: projectsTable.clientId,
      clientName: clientsTable.name
    })
      .from(projectsTable)
      .innerJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
      .where(and(
        eq(projectsTable.archived, false),
        or(ilike(projectsTable.name, pattern), ilike(clientsTable.name, pattern))
      ))
      .orderBy(asc(projectsTable.name), asc(projectsTable.id))
      .limit(SEARCH_RESULT_LIMIT),

    db.select({
      id: contactsTable.id,
      firstName: contactsTable.firstName,
      lastName: contactsTable.lastName,
      clientId: contactsTable.clientId,
      clientName: clientsTable.name
    })
      .from(contactsTable)
      .leftJoin(clientsTable, eq(contactsTable.clientId, clientsTable.id))
      .where(and(
        eq(contactsTable.archived, false),
        or(
          ilike(contactsTable.firstName, pattern),
          ilike(contactsTable.lastName, pattern),
          ilike(sql<string>`${contactsTable.firstName} || ' ' || ${contactsTable.lastName}`, pattern)
        )
      ))
      .orderBy(asc(contactsTable.firstName), asc(contactsTable.lastName), asc(contactsTable.id))
      .limit(SEARCH_RESULT_LIMIT)
  ])

  return { clients, projects, contacts }
})
