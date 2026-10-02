import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { test, expect, type Page } from '@playwright/test'
import { db } from '../app/db'
import { clientsTable } from '../app/db/schema/clients'
import { projectNotesTable } from '../app/db/schema/project-notes'
import { projectsTable } from '../app/db/schema/projects'

/**
 * Même isolation que e2e/project-notes-popover.spec.ts : un projet par test, supprimé à la fin
 * (ses notes partent en cascade), pour tourner en parallèle sur les trois navigateurs.
 */

let clientId: number
const createdProjectIds: number[] = []

const createProjectWithNote = async (note: Partial<typeof projectNotesTable.$inferInsert> = {}) => {
  const [project] = await db.insert(projectsTable)
    .values({ clientId, name: `Projet éditeur e2e ${randomUUID()}` })
    .returning({ id: projectsTable.id })
  createdProjectIds.push(project!.id)

  const [created] = await db.insert(projectNotesTable)
    .values({ projectId: project!.id, updatedAt: new Date('2026-01-01T10:00:00Z'), ...note })
    .returning()
  return { projectId: project!.id, note: created! }
}

const findNote = async (noteId: number) => {
  const [note] = await db.select().from(projectNotesTable).where(eq(projectNotesTable.id, noteId))
  return note
}

// Attendre l'hydratation : un raccourci ou un clic trop précoce est ignoré (voir e2e/auth.spec.ts).
const openNotePage = async (page: Page, projectId: number, noteId: number) => {
  await page.goto(`/clients/${clientId}/projects/${projectId}?note=${noteId}`)
  await page.waitForLoadState('networkidle')
  const editor = page.getByRole('textbox', { name: 'Contenu de la note' })
  await expect(editor).toBeVisible()
  return editor
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

test('un texte tapé vite puis fermé aussitôt est entièrement enregistré et relu à l\'identique', async ({ page }) => {
  const { projectId, note } = await createProjectWithNote()
  const editor = await openNotePage(page, projectId, note.id)

  await page.getByRole('textbox', { name: 'Titre de la note' }).fill('Rendez-vous client')
  await editor.click()
  await page.keyboard.type('Premier point important. Deuxième point tapé très vite juste avant de fermer')
  await page.keyboard.press('Escape')

  await expect(page).not.toHaveURL(/[?&]note=/)
  const saved = await findNote(note.id)
  expect(saved?.title).toBe('Rendez-vous client')
  expect(saved?.contentText).toBe('Premier point important. Deuxième point tapé très vite juste avant de fermer')

  const reopened = await openNotePage(page, projectId, note.id)
  await expect(reopened).toHaveText('Premier point important. Deuxième point tapé très vite juste avant de fermer')
  await expect(page.getByRole('textbox', { name: 'Titre de la note' })).toHaveValue('Rendez-vous client')
})

test('un lien ?note= rouvre la note après un rechargement de page', async ({ page }) => {
  const { projectId, note } = await createProjectWithNote({
    title: 'Note partagée',
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Contenu partagé' }] }] },
    contentText: 'Contenu partagé'
  })

  await openNotePage(page, projectId, note.id)
  await page.reload()
  await page.waitForLoadState('networkidle')

  await expect(page.getByRole('textbox', { name: 'Contenu de la note' })).toHaveText('Contenu partagé')
  await expect(page.getByRole('textbox', { name: 'Titre de la note' })).toHaveValue('Note partagée')
})

test('ouvrir puis fermer une note sans la modifier ne la marque pas comme modifiée', async ({ page }) => {
  const { projectId, note } = await createProjectWithNote({
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rien à changer' }] }] },
    contentText: 'Rien à changer'
  })

  await openNotePage(page, projectId, note.id)
  await page.getByRole('button', { name: 'Fermer la note' }).click()
  await expect(page).not.toHaveURL(/[?&]note=/)

  expect((await findNote(note.id))?.updatedAt.toISOString()).toBe('2026-01-01T10:00:00.000Z')
})

test('le bouton Lien suit la sélection : ajout puis retrait d\'un lien', async ({ page }) => {
  const { projectId, note } = await createProjectWithNote({
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Voir le site' }] }] },
    contentText: 'Voir le site'
  })
  const editor = await openNotePage(page, projectId, note.id)
  const selectLine = async () => {
    await editor.click()
    await page.keyboard.press('End')
    await page.keyboard.press('Shift+Home')
  }

  // L'éditeur s'ouvre sans sélection : le bouton doit se réactiver quand on sélectionne ensuite.
  await selectLine()
  const linkButton = page.getByRole('button', { name: 'Lien', exact: true })
  await linkButton.waitFor()
  // Lu une seule fois, sans réessai : l'état doit être juste dès que la barre apparaît.
  expect(await linkButton.isEnabled()).toBe(true)

  await linkButton.click()
  await page.getByRole('textbox', { name: 'Adresse du lien' }).fill('exemple.fr')
  await page.keyboard.press('Enter')
  const link = editor.getByRole('link', { name: 'Voir le site' })
  await expect(link).toHaveAttribute('href', 'https://exemple.fr')

  await selectLine()
  await linkButton.click()
  const removeButton = page.getByRole('button', { name: 'Retirer le lien' })
  await expect(removeButton).toBeEnabled()
  await removeButton.click()
  await expect(link).toBeHidden()
  await expect(editor).toHaveText('Voir le site')
})

test('les raccourcis markdown produisent titres, listes et cases à cocher', async ({ page }) => {
  const { projectId, note } = await createProjectWithNote()
  const editor = await openNotePage(page, projectId, note.id)

  await editor.click()
  await page.keyboard.type('## Ordre du jour')
  await page.keyboard.press('Enter')
  await page.keyboard.type('- Budget')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await page.keyboard.type('[ ] Envoyer le devis')
  await page.keyboard.press('Escape')
  await expect(page).not.toHaveURL(/[?&]note=/)

  const saved = await findNote(note.id)
  const blockTypes = (saved?.content as { content: { type: string }[] }).content.map(block => block.type)
  // Le paragraphe final vide est ajouté par TipTap (TrailingNode) pour pouvoir sortir de la liste.
  expect(blockTypes).toEqual(['heading', 'bulletList', 'taskList', 'paragraph'])
  expect(saved?.contentText).toBe('Ordre du jour\nBudget\nEnvoyer le devis')
})

test('une modification faite ailleurs déclenche un conflit, et la version serveur peut être rechargée', async ({ page }) => {
  const { projectId, note } = await createProjectWithNote({
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Version initiale' }] }] },
    contentText: 'Version initiale'
  })
  const editor = await openNotePage(page, projectId, note.id)

  await db.update(projectNotesTable).set({
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Version du collègue' }] }] },
    contentText: 'Version du collègue',
    updatedAt: new Date('2026-02-01T10:00:00Z')
  }).where(eq(projectNotesTable.id, note.id))

  await editor.click()
  await page.keyboard.press('End')
  await page.keyboard.type(' modifiée ici')

  await expect(page.getByText('Cette note a été modifiée ailleurs entre-temps')).toBeVisible()
  expect((await findNote(note.id))?.contentText).toBe('Version du collègue')

  await page.getByRole('button', { name: 'Charger la version enregistrée' }).click()
  await expect(page.getByRole('textbox', { name: 'Contenu de la note' })).toHaveText('Version du collègue')
  await expect(page.getByText('Cette note a été modifiée ailleurs entre-temps')).toBeHidden()
})

test('une note ouverte depuis le popover puis supprimée disparaît du badge', async ({ page }) => {
  const { projectId, note } = await createProjectWithNote({ title: 'À supprimer' })
  await page.goto(`/clients/${clientId}/projects/${projectId}`)
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Notes du projet (1)' }).click()
  await page.getByRole('list', { name: 'Notes du projet' }).getByRole('button', { name: /^À supprimer/ }).click()
  await expect(page).toHaveURL(new RegExp(`[?&]note=${note.id}(&|$)`))
  await expect(page.getByRole('textbox', { name: 'Contenu de la note' })).toBeVisible()

  await page.getByRole('button', { name: 'Actions de la note' }).click()
  await page.getByRole('menuitem', { name: 'Supprimer la note' }).click()
  await page.getByRole('button', { name: 'Confirmer' }).click()

  await expect(page).not.toHaveURL(/[?&]note=/)
  await expect(page.getByRole('button', { name: 'Notes du projet', exact: true })).toBeVisible()
  expect(await findNote(note.id)).toBeUndefined()
})
