import assert from 'node:assert/strict'
import test from 'node:test'
import {
  defaultClientIcon,
  getClientIcon,
  normalizeClientStatus
} from '../app/lib/clients'
import { clientCreateSchema } from '../app/validation/clients'

test('clientCreateSchema accepte une icone connue', () => {
  const result = clientCreateSchema.parse({
    name: 'Client test',
    icon: 'i-lucide-building-2'
  })

  assert.equal(result.icon, 'i-lucide-building-2')
})

test('clientCreateSchema refuse une icone libre non proposee', () => {
  const result = clientCreateSchema.safeParse({
    name: 'Client test',
    icon: 'briefcase'
  })

  assert.equal(result.success, false)
})

test('normalizeClientStatus retourne active par defaut', () => {
  assert.equal(normalizeClientStatus(undefined), 'active')
  assert.equal(normalizeClientStatus('unexpected'), 'active')
})

test('normalizeClientStatus conserve les statuts connus', () => {
  assert.equal(normalizeClientStatus('archived'), 'archived')
})

test('getClientIcon retourne l icone par defaut si aucune valeur n est fournie', () => {
  assert.equal(getClientIcon(undefined), defaultClientIcon)
  assert.equal(getClientIcon(null), defaultClientIcon)
  assert.equal(getClientIcon(''), defaultClientIcon)
})

test('getClientIcon conserve l icone fournie', () => {
  assert.equal(getClientIcon('i-lucide-store'), 'i-lucide-store')
})
