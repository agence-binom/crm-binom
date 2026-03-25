import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getDefaultTaskWorkflowTag,
  normalizeTaskWorkflowTag,
  resolveTaskLifecycleDates,
  sortTasksByDueDate
} from '../app/lib/tasks'

test('sortTasksByDueDate place les echeances les plus proches en premier', () => {
  const tasks = [
    { id: 1, dueDate: '2026-04-10T00:00:00.000Z' },
    { id: 2, dueDate: '2026-03-25T00:00:00.000Z' },
    { id: 3, dueDate: '2026-03-28T00:00:00.000Z' }
  ]

  const result = sortTasksByDueDate(tasks)

  assert.deepEqual(result.map(task => task.id), [2, 3, 1])
})

test('sortTasksByDueDate place les taches sans echeance en dernier', () => {
  const tasks = [
    { id: 1, dueDate: null },
    { id: 2, dueDate: '2026-03-25T00:00:00.000Z' },
    { id: 3, dueDate: null }
  ]

  const result = sortTasksByDueDate(tasks)

  assert.deepEqual(result.map(task => task.id), [2, 1, 3])
})

test('normalizeTaskWorkflowTag conserve un tag valide pour le statut', () => {
  assert.equal(normalizeTaskWorkflowTag('waiting', 'budget'), 'budget')
  assert.equal(normalizeTaskWorkflowTag('validation', 'client'), 'client')
})

test('normalizeTaskWorkflowTag remplace un tag invalide par le tag par defaut', () => {
  assert.equal(normalizeTaskWorkflowTag('waiting', 'client'), 'information')
  assert.equal(normalizeTaskWorkflowTag('validation', 'budget'), 'binom')
})

test('normalizeTaskWorkflowTag supprime le tag pour les statuts sans tag', () => {
  assert.equal(normalizeTaskWorkflowTag('todo', 'budget'), null)
  assert.equal(normalizeTaskWorkflowTag('done', 'client'), null)
})

test('getDefaultTaskWorkflowTag retourne null pour un statut sans tag', () => {
  assert.equal(getDefaultTaskWorkflowTag('in_progress'), null)
})

test('resolveTaskLifecycleDates ajoute startedAt au premier deplacement hors todo', () => {
  const now = new Date('2026-03-25T10:00:00.000Z')

  const result = resolveTaskLifecycleDates({
    currentStatus: 'todo',
    nextStatus: 'in_progress',
    startedAt: null,
    completedAt: null,
    now
  })

  assert.equal(result.startedAt, now)
  assert.equal(result.completedAt, null)
})

test('resolveTaskLifecycleDates ajoute startedAt et completedAt lors du passage en done', () => {
  const now = new Date('2026-03-25T10:00:00.000Z')

  const result = resolveTaskLifecycleDates({
    currentStatus: 'todo',
    nextStatus: 'done',
    startedAt: null,
    completedAt: null,
    now
  })

  assert.equal(result.startedAt, now)
  assert.equal(result.completedAt, now)
})

test('resolveTaskLifecycleDates retire completedAt quand une tache quitte done', () => {
  const startedAt = new Date('2026-03-24T09:00:00.000Z')
  const completedAt = new Date('2026-03-25T09:00:00.000Z')

  const result = resolveTaskLifecycleDates({
    currentStatus: 'done',
    nextStatus: 'validation',
    startedAt,
    completedAt,
    now: new Date('2026-03-26T09:00:00.000Z')
  })

  assert.equal(result.startedAt, startedAt)
  assert.equal(result.completedAt, null)
})
