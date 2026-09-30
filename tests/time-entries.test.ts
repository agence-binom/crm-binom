import assert from 'node:assert/strict'
import test from 'node:test'
import { timeEntryCreateSchema } from '../app/validation/time-entries'

test('timeEntryCreateSchema accepte une saisie directe sur un projet, sans tâche', () => {
  const result = timeEntryCreateSchema.parse({ projectId: 1, taskId: null, userId: 1, duration: 30 })

  assert.equal(result.projectId, 1)
  assert.equal(result.taskId, null)
})

test('timeEntryCreateSchema accepte une saisie rattachée à une tâche seule', () => {
  assert.equal(timeEntryCreateSchema.safeParse({ taskId: 1, userId: 1, duration: 30 }).success, true)
})

test('timeEntryCreateSchema refuse une saisie sans tâche ni projet', () => {
  assert.equal(timeEntryCreateSchema.safeParse({ taskId: null, projectId: null, userId: 1, duration: 30 }).success, false)
})
