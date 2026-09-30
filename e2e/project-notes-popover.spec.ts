import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { test, expect, type Page } from '@playwright/test'
import { db } from '../app/db'
import { clientsTable } from '../app/db/schema/clients'
import { projectNotesTable } from '../app/db/schema/project-notes'
import { projectsTable } from '../app/db/schema/projects'

/**
 * Chaque test crée son propre projet (supprimé ensuite, ses notes partent en cascade) : le badge
 * compte les notes du projet, un projet seedé partagé entre chromium/firefox/webkit en parallèle
 * rendrait ce compte imprévisible.
 */

let clientId: number
const createdProjectIds: number[] = []

const createProject = async () => {
  const [project] = await db.insert(projectsTable)
    .values({ clientId, name: `Projet notes e2e ${randomUUID()}` })
    .returning({ id: projectsTable.id })
  createdProjectIds.push(project!.id)
  return project!.id
}

// Un clic ou un raccourci trop précoce est ignoré tant que Vue n'a pas attaché ses listeners
// (voir e2e/auth.spec.ts) : on attend la fin de l'hydratation avant d'interagir.
const gotoProject = async (page: Page, projectId: number) => {
  await page.goto(`/clients/${clientId}/projects/${projectId}`)
  await page.waitForLoadState('networkidle')
}

test.beforeAll(async () => {
  const [client] = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.name, 'Atelier Dupont'))
  clientId = client!.id
})

test.afterAll(async () => {
  for (const id of createdProjectIds) {
    await db.delete(projectsTable).where(eq(projectsTable.id, id))
  }
})

test('un projet sans note propose de créer la première, qui s\'ouvre et incrémente le badge', async ({ page }) => {
  const projectId = await createProject()
  await gotoProject(page, projectId)

  const trigger = page.getByRole('button', { name: 'Notes du projet', exact: true })
  await trigger.click()
  await expect(page.getByText('Aucune note pour ce projet')).toBeVisible()

  await page.getByRole('button', { name: 'Créer la première note' }).click()
  await expect(page).toHaveURL(/[?&]note=\d+/)
  await expect(page.getByRole('textbox', { name: 'Contenu de la note' })).toBeFocused()

  // La note ouverte masque le reste de la page (modale) : on la referme pour vérifier le badge.
  await page.keyboard.press('Escape')
  await expect(page).not.toHaveURL(/[?&]note=/)
  await expect(page.getByRole('button', { name: 'Notes du projet (1)' })).toBeVisible()
  await page.getByRole('button', { name: 'Notes du projet (1)' }).click()
  await expect(page.getByRole('list', { name: 'Notes du projet' }).getByText('Sans titre')).toBeVisible()
})

test('le popover se pilote entièrement au clavier', async ({ page }) => {
  const projectId = await createProject()
  const [olderNote] = await db.insert(projectNotesTable).values([
    { projectId, title: 'Note ancienne', updatedAt: new Date('2026-01-01T10:00:00Z') },
    { projectId, title: 'Note récente', updatedAt: new Date('2026-06-01T10:00:00Z') }
  ]).returning({ id: projectNotesTable.id })

  await gotoProject(page, projectId)
  await expect(page.getByRole('button', { name: 'Notes du projet (2)' })).toBeVisible()

  await page.keyboard.press('n')
  const list = page.getByRole('list', { name: 'Notes du projet' })
  await expect(list).toBeVisible()
  await expect(list.getByRole('button')).toHaveText([/Note récente/, /Note ancienne/])

  await page.keyboard.press('Escape')
  await expect(list).toBeHidden()

  await page.keyboard.press('n')
  await page.keyboard.press('ArrowDown')
  await expect(list.getByRole('button', { name: /Note récente/ })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(list.getByRole('button', { name: /Note ancienne/ })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(list.getByRole('button', { name: /Note récente/ })).toBeFocused()

  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`[?&]note=${olderNote!.id}(&|$)`))
  await expect(list).toBeHidden()
})

test('la recherche apparaît à partir de 8 notes et filtre la liste', async ({ page }) => {
  const projectId = await createProject()
  await db.insert(projectNotesTable).values(
    Array.from({ length: 8 }, (_, index) => ({ projectId, title: index === 0 ? 'Accès hébergeur' : `Note ${index}` }))
  )

  await gotoProject(page, projectId)
  await page.getByRole('button', { name: 'Notes du projet (8)' }).click()

  const search = page.getByRole('textbox', { name: 'Rechercher une note' })
  await search.fill('acces')
  await expect(page.getByRole('list', { name: 'Notes du projet' }).getByRole('button')).toHaveText([/Accès hébergeur/])

  await search.fill('introuvable')
  await expect(page.getByText('Aucune note ne correspond à « introuvable ».')).toBeVisible()
})
