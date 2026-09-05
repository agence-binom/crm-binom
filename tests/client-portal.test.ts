import assert from 'node:assert/strict'
import test from 'node:test'
import { canManagePortalAccess, isAlreadyRegisteredAuthError } from '../server/lib/client-portal'

test('isAlreadyRegisteredAuthError reconnait le code email_exists', () => {
  assert.equal(isAlreadyRegisteredAuthError({ code: 'email_exists' }), true)
})

test('isAlreadyRegisteredAuthError reconnait le code user_already_exists', () => {
  assert.equal(isAlreadyRegisteredAuthError({ code: 'user_already_exists' }), true)
})

test('isAlreadyRegisteredAuthError reconnait le message Supabase legacy', () => {
  assert.equal(
    isAlreadyRegisteredAuthError({ message: 'A user with this email address has already been registered' }),
    true
  )
})

test('isAlreadyRegisteredAuthError renvoie false pour une autre erreur', () => {
  assert.equal(isAlreadyRegisteredAuthError({ code: 'unexpected_failure', message: 'boom' }), false)
})

test('isAlreadyRegisteredAuthError renvoie false pour une absence d\'erreur', () => {
  assert.equal(isAlreadyRegisteredAuthError(null), false)
  assert.equal(isAlreadyRegisteredAuthError(undefined), false)
})

test('canManagePortalAccess autorise uniquement le role admin', () => {
  assert.equal(canManagePortalAccess('admin'), true)
  assert.equal(canManagePortalAccess('employee'), false)
  assert.equal(canManagePortalAccess(null), false)
  assert.equal(canManagePortalAccess(undefined), false)
})
