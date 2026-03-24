import assert from 'node:assert/strict'
import test from 'node:test'
import { sortTasksByDueDate } from '../app/lib/tasks'

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
