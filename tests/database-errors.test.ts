import assert from 'node:assert/strict'
import test from 'node:test'
import { toPublicDatabaseError } from '../server/utils/database-errors'

test('toPublicDatabaseError transforme une erreur ENOTFOUND Supabase directe en erreur publique exploitable', () => {
  const error = toPublicDatabaseError({
    code: 'ENOTFOUND',
    hostname: 'db.example-project-ref.supabase.co'
  })

  assert.equal(error.statusCode, 503)
  assert.match(error.statusMessage, /Session pooler/i)
})

test('toPublicDatabaseError laisse intactes les erreurs non reconnues', () => {
  const originalError = new Error('boom')
  const error = toPublicDatabaseError(originalError)

  assert.equal(error, originalError)
})
