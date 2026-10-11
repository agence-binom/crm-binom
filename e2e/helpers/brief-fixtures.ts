import { randomUUID } from 'node:crypto'
import { inArray } from 'drizzle-orm'
import { db } from '../../app/db'
import { clientsTable } from '../../app/db/schema/clients'
import { contactsTable } from '../../app/db/schema/contacts'
import { projectBriefsTable } from '../../app/db/schema/project-briefs'
import { projectsTable } from '../../app/db/schema/projects'
import { defaultBriefExpiresInDays } from '../../app/constants/briefs'
import { getBriefExpiresAt } from '../../app/lib/briefs'
import { generateBriefToken } from '../../server/lib/external-api'

/**
 * Chaque test brief crée son propre prospect : les projets Playwright tournent en parallèle sur la
 * même base, et la réception d'un brief crée des projets - un prospect partagé rendrait les
 * comptages et le préremplissage « brief précédent » dépendants des autres tests.
 */
export const createBriefFixtures = () => {
  const clientIds: number[] = []
  const contactIds: number[] = []

  const createProspect = async (name = 'Prospect brief e2e') => {
    const [client] = await db.insert(clientsTable)
      .values({ name: `${name} ${randomUUID().slice(0, 8)}`, prospectionStatus: 'contacte', email: 'contact@prospect-e2e.test' })
      .returning({ id: clientsTable.id, name: clientsTable.name })
    const [contact] = await db.insert(contactsTable)
      .values({ clientId: client!.id, firstName: 'Rose', lastName: 'Garnier', email: 'rose@prospect-e2e.test', mobile: '+33 6 56 78 90 12' })
      .returning({ id: contactsTable.id })
    clientIds.push(client!.id)
    contactIds.push(contact!.id)
    return { clientId: client!.id, clientName: client!.name, contactId: contact!.id }
  }

  const createProject = async (clientId: number, values: Partial<typeof projectsTable.$inferInsert> = {}) => {
    const [project] = await db.insert(projectsTable)
      .values({ clientId, name: 'Projet saisi à la main', status: 'sans_statut', ...values })
      .returning()
    return project!
  }

  const createBrief = async (values: Partial<typeof projectBriefsTable.$inferInsert> & { clientId: number }) => {
    const [brief] = await db.insert(projectBriefsTable).values({
      token: generateBriefToken(),
      expiresAt: getBriefExpiresAt(defaultBriefExpiresInDays),
      ...values
    }).returning()
    return brief!
  }

  // Supprimer le client emporte ses projets et ses briefs (cascade) ; ses contacts passeraient
  // seulement à clientId null, d'où leur suppression explicite.
  const cleanup = async () => {
    if (contactIds.length > 0) await db.delete(contactsTable).where(inArray(contactsTable.id, contactIds))
    if (clientIds.length > 0) await db.delete(clientsTable).where(inArray(clientsTable.id, clientIds))
  }

  return { createProspect, createProject, createBrief, cleanup }
}
