import assert from 'node:assert/strict'
import test from 'node:test'
import { canManagePortalAccess } from '../server/lib/client-portal'

test('canManagePortalAccess autorise uniquement le role admin', () => {
  assert.equal(canManagePortalAccess('admin'), true)
  assert.equal(canManagePortalAccess('employee'), false)
  assert.equal(canManagePortalAccess(null), false)
  assert.equal(canManagePortalAccess(undefined), false)
})
