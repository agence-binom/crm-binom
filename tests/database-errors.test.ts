import assert from 'node:assert/strict'
import test from 'node:test'
import { toPublicDatabaseError } from '../server/utils/database-errors'

test('toPublicDatabaseError transforme un hôte de base introuvable en 503', () => {
  const error = toPublicDatabaseError({ code: 'ENOTFOUND', hostname: 'db.interne.local' })

  assert.equal(error.statusCode, 503)
  assert.match(error.statusMessage, /injoignable/i)
})

test('toPublicDatabaseError transforme une connexion refusée en 503', () => {
  const error = toPublicDatabaseError({ code: 'ECONNREFUSED' })

  assert.equal(error.statusCode, 503)
})

test('toPublicDatabaseError ne fuite jamais l\'hôte de la base dans la réponse', () => {
  const error = toPublicDatabaseError({ code: 'ENOTFOUND', hostname: 'db.interne.local' })

  assert.doesNotMatch(error.statusMessage, /db\.interne\.local/)
})

test('toPublicDatabaseError laisse intactes les erreurs non reconnues', () => {
  const originalError = new Error('boom')
  const error = toPublicDatabaseError(originalError)

  assert.equal(error, originalError)
})
