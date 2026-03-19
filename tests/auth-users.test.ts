import assert from 'node:assert/strict'
import test from 'node:test'
import { findUserByEmail, normalizeEmailAddress } from '../server/lib/auth-users'

test('normalizeEmailAddress normalise la casse et les espaces', () => {
  assert.equal(
    normalizeEmailAddress('  Loic.Str56@GMAIL.com '),
    'loic.str56@gmail.com'
  )
})

test('findUserByEmail retrouve un utilisateur existant', () => {
  const user = findUserByEmail([
    { email: 'admin@binom.fr', id: 1 },
    { email: 'loic.str56@gmail.com', id: 2 }
  ], '  LOIC.STR56@gmail.com ')

  assert.deepEqual(user, { email: 'loic.str56@gmail.com', id: 2 })
})

test('findUserByEmail retourne null pour un email inexistant', () => {
  const user = findUserByEmail([
    { email: 'admin@binom.fr', id: 1 }
  ], 'inconnu@binom.fr')

  assert.equal(user, null)
})
