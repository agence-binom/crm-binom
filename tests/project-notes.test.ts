import assert from 'node:assert/strict'
import test from 'node:test'
import { extractProjectNoteText, filterProjectNotes, getProjectNoteDisplayTitle, getProjectNoteExcerpt } from '../app/lib/project-notes'
import {
  projectNoteContentMaxBytes,
  projectNoteCreateSchema,
  projectNoteListQuerySchema,
  projectNoteUpdateSchema
} from '../app/validation/project-notes'

const paragraph = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] })
const doc = (...content: Record<string, unknown>[]) => ({ type: 'doc' as const, content })

test('projectNoteCreateSchema accepte un corps vide (note vierge)', () => {
  const result = projectNoteCreateSchema.safeParse({})

  assert.equal(result.success, true)
})

test('projectNoteCreateSchema accepte un document TipTap et normalise un titre vide en null', () => {
  const result = projectNoteCreateSchema.safeParse({ title: '   ', content: doc(paragraph('Bonjour')) })

  assert.equal(result.success, true)
  assert.equal(result.data?.title, null)
})

test('projectNoteCreateSchema refuse un contenu qui n\'est pas un document', () => {
  assert.equal(projectNoteCreateSchema.safeParse({ content: { type: 'paragraph' } }).success, false)
  assert.equal(projectNoteCreateSchema.safeParse({ content: 'texte brut' }).success, false)
})

test('projectNoteCreateSchema refuse un titre de plus de 255 caractères', () => {
  const result = projectNoteCreateSchema.safeParse({ title: 'a'.repeat(256) })

  assert.equal(result.success, false)
})

test('projectNoteCreateSchema refuse un contenu de plus de 1 Mo', () => {
  const result = projectNoteCreateSchema.safeParse({ content: doc(paragraph('a'.repeat(projectNoteContentMaxBytes))) })

  assert.equal(result.success, false)
})

test('projectNoteCreateSchema compte la taille en octets, pas en caractères', () => {
  // "é" pèse 2 octets en UTF-8 : ~600 000 caractères passent sous 1 Mo en longueur mais pas en taille.
  const result = projectNoteCreateSchema.safeParse({ content: doc(paragraph('é'.repeat(600_000))) })

  assert.equal(result.success, false)
})

test('projectNoteCreateSchema accepte un plan à puces profond avec un lien au dernier niveau', () => {
  let item: Record<string, unknown> = {
    type: 'listItem',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'lien', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] }] }]
  }
  for (let level = 0; level < 20; level++) {
    item = { type: 'listItem', content: [paragraph(`Niveau ${level}`), { type: 'bulletList', content: [item] }] }
  }

  const result = projectNoteCreateSchema.safeParse({ content: doc({ type: 'bulletList', content: [item] }) })

  assert.equal(result.success, true)
})

test('projectNoteCreateSchema refuse un document imbriqué au-delà de la profondeur maximale', () => {
  let node: Record<string, unknown> = paragraph('fond')
  for (let depth = 0; depth < 150; depth++) node = { type: 'blockquote', content: [node] }

  const result = projectNoteCreateSchema.safeParse({ content: doc(node) })

  assert.equal(result.success, false)
})

test('projectNoteCreateSchema ignore un contentText envoyé par le client', () => {
  const result = projectNoteCreateSchema.safeParse({ content: doc(paragraph('Vrai contenu')), contentText: 'Faux aperçu' })

  assert.equal(result.success, true)
  assert.equal('contentText' in result.data!, false)
})

test('projectNoteUpdateSchema exige updatedAt', () => {
  const result = projectNoteUpdateSchema.safeParse({ title: 'Nouveau titre' })

  assert.equal(result.success, false)
})

test('projectNoteUpdateSchema refuse un updatedAt invalide', () => {
  const result = projectNoteUpdateSchema.safeParse({ updatedAt: 'hier', title: 'Nouveau titre' })

  assert.equal(result.success, false)
})

test('projectNoteUpdateSchema exige au moins title ou content', () => {
  const result = projectNoteUpdateSchema.safeParse({ updatedAt: '2026-07-01T09:15:00.000Z' })

  assert.equal(result.success, false)
})

test('projectNoteUpdateSchema accepte l\'effacement du contenu (null)', () => {
  const result = projectNoteUpdateSchema.safeParse({ updatedAt: '2026-07-01T09:15:00.000Z', content: null })

  assert.equal(result.success, true)
  assert.equal(result.data?.content, null)
})

test('projectNoteListQuerySchema traite une recherche vide comme absente', () => {
  const result = projectNoteListQuerySchema.safeParse({ q: '  ' })

  assert.equal(result.success, true)
  assert.equal(result.data?.q, undefined)
})

test('extractProjectNoteText met un bloc par ligne et concatène le texte inline', () => {
  const content = doc(
    { type: 'heading', content: [{ type: 'text', text: 'Kick-off ' }, { type: 'text', text: 'client', marks: [{ type: 'bold' }] }] },
    { type: 'bulletList', content: [
      { type: 'listItem', content: [paragraph('Point 1')] },
      { type: 'listItem', content: [paragraph('Point 2')] }
    ] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Avant' }, { type: 'hardBreak' }, { type: 'text', text: 'Après' }] }
  )

  assert.equal(extractProjectNoteText(content), 'Kick-off client\nPoint 1\nPoint 2\nAvant\nAprès')
})

test('extractProjectNoteText renvoie null pour un document vide ou absent', () => {
  assert.equal(extractProjectNoteText(doc({ type: 'paragraph' })), null)
  assert.equal(extractProjectNoteText(null), null)
  assert.equal(extractProjectNoteText(undefined), null)
})

test('getProjectNoteDisplayTitle retombe sur la première ligne non vide, puis sur "Sans titre"', () => {
  assert.equal(getProjectNoteDisplayTitle({ title: 'Compte rendu', contentText: 'Ligne 1' }), 'Compte rendu')
  assert.equal(getProjectNoteDisplayTitle({ title: null, contentText: '\n  Ligne 1\nLigne 2' }), 'Ligne 1')
  assert.equal(getProjectNoteDisplayTitle({ title: null, contentText: null }), 'Sans titre')
})

test('getProjectNoteExcerpt ne répète pas la première ligne quand elle sert de titre', () => {
  assert.equal(getProjectNoteExcerpt({ title: null, contentText: 'Ligne 1\nLigne 2\nLigne 3' }), 'Ligne 2 Ligne 3')
  assert.equal(getProjectNoteExcerpt({ title: 'Titre', contentText: 'Ligne 1\nLigne 2' }), 'Ligne 1 Ligne 2')
  assert.equal(getProjectNoteExcerpt({ title: null, contentText: 'Seule ligne' }), null)
})

test('getProjectNoteExcerpt tronque les aperçus trop longs', () => {
  const excerpt = getProjectNoteExcerpt({ title: 'Titre', contentText: 'a'.repeat(500) })

  assert.equal(excerpt?.length, 161)
  assert.equal(excerpt?.endsWith('…'), true)
})

test('filterProjectNotes ignore la casse et les accents', () => {
  const notes = [
    { id: 1, displayTitle: 'Compte rendu kick-off', excerpt: null, authorName: 'Admin' },
    { id: 2, displayTitle: 'Accès FTP', excerpt: 'À stocker dans le coffre', authorName: 'Employé' }
  ]

  assert.deepEqual(filterProjectNotes(notes, 'acces').map(note => note.id), [2])
  assert.deepEqual(filterProjectNotes(notes, 'COFFRE').map(note => note.id), [2])
  assert.deepEqual(filterProjectNotes(notes, 'admin').map(note => note.id), [1])
  assert.deepEqual(filterProjectNotes(notes, '  ').map(note => note.id), [1, 2])
})
