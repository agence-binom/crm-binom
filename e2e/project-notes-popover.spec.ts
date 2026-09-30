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

const countNotes = async (projectId: number) => {
  const rows = await db.select({ id: projectNotesTable.id }).from(projectNotesTable).where(eq(projectNotesTable.projectId, projectId))
  return rows.length
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
  // Un Échap envoyé dès que l'éditeur a le focus peut arriver avant que la modale soit prête à le
  // traiter (vu en e2e, jamais à la main) : on le renvoie tant que la note n'est pas fermée.
  await expect(async () => {
    await page.keyboard.press('Escape')
    await expect(page).not.toHaveURL(/[?&]note=/, { timeout: 1000 })
  }).toPass()
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

  await page.keyboard.press('Shift+N')
  const list = page.getByRole('list', { name: 'Notes du projet' })
  await expect(list).toBeVisible()
  await expect(list.locator('[data-note-item]')).toHaveText([/Note récente/, /Note ancienne/])

  await page.keyboard.press('Escape')
  await expect(list).toBeHidden()

  await page.keyboard.press('Shift+N')
  await expect(list).toBeVisible()
  await page.keyboard.press('Shift+N')
  await expect(list).toBeHidden()

  await page.keyboard.press('Shift+N')
  await page.keyboard.press('ArrowDown')
  await expect(list.getByRole('button', { name: /^Note récente/ })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(list.getByRole('button', { name: /^Note ancienne/ })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(list.getByRole('button', { name: /^Note récente/ })).toBeFocused()

  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`[?&]note=${olderNote!.id}(&|$)`))
  await expect(list).toBeHidden()
})

test('« n » crée une note ouverte en plein écran, sans en recréer une pendant la saisie', async ({ page }) => {
  const projectId = await createProject()
  await gotoProject(page, projectId)

  await page.keyboard.press('n')
  await expect(page).toHaveURL(/[?&]note=\d+/)
  const editor = page.getByRole('textbox', { name: 'Contenu de la note' })
  await expect(editor).toBeFocused()

  await page.keyboard.type('nouvelle idée')
  await page.getByRole('textbox', { name: 'Titre de la note' }).click()
  await page.keyboard.type('n')
  // Hors champ de saisie, c'est la note ouverte qui bloque. Pas « Fermer la note » : son tooltip
  // s'ouvrirait au focus et absorberait le premier Échap.
  await page.getByRole('button', { name: 'Actions de la note' }).focus()
  await page.keyboard.press('n')

  await page.keyboard.press('Escape')
  await expect(page).not.toHaveURL(/[?&]note=/)
  await expect(page.getByRole('button', { name: 'Notes du projet (1)' })).toBeVisible()
  expect(await countNotes(projectId)).toBe(1)
})

test('« n » ne crée pas de note depuis une recherche, une tâche ou une autre page', async ({ page }) => {
  const projectId = await createProject()
  await db.insert(projectNotesTable).values(
    Array.from({ length: 8 }, (_, index) => ({ projectId, title: `Note ${index}` }))
  )
  await gotoProject(page, projectId)

  await page.getByRole('button', { name: 'Notes du projet (8)' }).click()
  await page.getByRole('textbox', { name: 'Rechercher une note' }).pressSequentially('n')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Ajouter une tâche' }).click()
  await page.getByRole('textbox', { name: 'Titre de la tâche' }).pressSequentially('n')
  // Focus sur un bouton de la modale plutôt que sur un champ : c'est la modale ouverte qui bloque.
  await page.getByRole('dialog').getByRole('button').first().focus()
  await page.keyboard.press('n')
  await expect(page).not.toHaveURL(/[?&]note=/)
  await page.keyboard.press('Escape')

  await page.goto(`/clients/${clientId}`)
  await page.waitForLoadState('networkidle')
  await page.keyboard.press('n')
  await page.keyboard.press('Shift+N')
  await expect(page.getByRole('list', { name: 'Notes du projet' })).toBeHidden()

  expect(await countNotes(projectId)).toBe(8)
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
  await expect(page.getByRole('list', { name: 'Notes du projet' }).locator('[data-note-item]')).toHaveText([/Accès hébergeur/])

  await search.fill('introuvable')
  await expect(page.getByText('Aucune note ne correspond à « introuvable ».')).toBeVisible()
})

test('une note se supprime depuis la liste après confirmation, sans refermer le popover', async ({ page }) => {
  const projectId = await createProject()
  await db.insert(projectNotesTable).values([
    { projectId, title: 'À garder', updatedAt: new Date('2026-01-01T10:00:00Z') },
    { projectId, title: 'À supprimer', updatedAt: new Date('2026-06-01T10:00:00Z') }
  ])
  await gotoProject(page, projectId)

  await page.getByRole('button', { name: 'Notes du projet (2)' }).click()
  const list = page.getByRole('list', { name: 'Notes du projet' })
  const requestDelete = async () => {
    await list.locator('li', { hasText: 'À supprimer' }).hover()
    await list.getByRole('button', { name: 'Supprimer la note « À supprimer »' }).click()
  }
  await requestDelete()

  const confirm = page.getByRole('dialog').filter({ hasText: 'sera définitivement supprimée' })
  await expect(confirm).toContainText('« À supprimer » sera définitivement supprimée.')
  await confirm.getByRole('button', { name: 'Annuler' }).click()
  await expect(confirm).toBeHidden()
  await expect(list.locator('[data-note-item]')).toHaveText([/À supprimer/, /À garder/])
  expect(await countNotes(projectId)).toBe(2)

  await requestDelete()
  await confirm.getByRole('button', { name: 'Confirmer' }).click()

  await expect(list.locator('[data-note-item]')).toHaveText([/À garder/])
  await expect(page.getByRole('button', { name: 'Notes du projet (1)' })).toBeVisible()
  expect(await countNotes(projectId)).toBe(1)
})

test('Suppr sur une note sélectionnée demande confirmation, Échap annule', async ({ page }) => {
  const projectId = await createProject()
  await db.insert(projectNotesTable).values({ projectId, title: 'Note clavier' })
  await gotoProject(page, projectId)

  await page.keyboard.press('Shift+N')
  const list = page.getByRole('list', { name: 'Notes du projet' })
  await page.keyboard.press('ArrowDown')
  await expect(list.getByRole('button', { name: /^Note clavier/ })).toBeFocused()

  await page.keyboard.press('Delete')
  const confirm = page.getByRole('dialog').filter({ hasText: 'sera définitivement supprimée' })
  await expect(confirm).toBeVisible()
  // Échap ne referme que la confirmation, pas le popover derrière elle.
  await page.keyboard.press('Escape')
  await expect(confirm).toBeHidden()
  await expect(list).toBeVisible()

  await list.locator('[data-note-item]').focus()
  await page.keyboard.press('Backspace')
  await confirm.getByRole('button', { name: 'Confirmer' }).click()
  await expect(page.getByText('Aucune note pour ce projet')).toBeVisible()
  expect(await countNotes(projectId)).toBe(0)
})
