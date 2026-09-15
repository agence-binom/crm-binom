import assert from 'node:assert/strict'
import test from 'node:test'
import { canManageUsers } from '../server/lib/users'

test('canManageUsers autorise uniquement le role admin', () => {
  assert.equal(canManageUsers('admin'), true)
  assert.equal(canManageUsers('employee'), false)
  assert.equal(canManageUsers(null), false)
  assert.equal(canManageUsers(undefined), false)
})
