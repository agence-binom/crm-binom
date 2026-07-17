import assert from 'node:assert/strict'
import test from 'node:test'
import {
  defaultClientIcon,
  getClientIcon
} from '../app/lib/clients'
import { clientCreateSchema, clientsDashboardQuerySchema } from '../app/validation/clients'

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

test('clientCreateSchema archive a false par defaut', () => {
  const result = clientCreateSchema.parse({
    name: 'Client test'
  })

  assert.equal(result.archived, false)
})

test('clientCreateSchema conserve archived a true si fourni', () => {
  const result = clientCreateSchema.parse({
    name: 'Client test',
    archived: true
  })

  assert.equal(result.archived, true)
})

test('clientsDashboardQuerySchema retourne false par defaut sans parametre', () => {
  const result = clientsDashboardQuerySchema.parse({})

  assert.equal(result.archived, false)
})

test('clientsDashboardQuerySchema interprete correctement les chaines "true" et "false"', () => {
  assert.equal(clientsDashboardQuerySchema.parse({ archived: 'false' }).archived, false)
  assert.equal(clientsDashboardQuerySchema.parse({ archived: 'true' }).archived, true)
})

test('getClientIcon retourne l icone par defaut si aucune valeur n est fournie', () => {
  assert.equal(getClientIcon(undefined), defaultClientIcon)
  assert.equal(getClientIcon(null), defaultClientIcon)
  assert.equal(getClientIcon(''), defaultClientIcon)
})

test('getClientIcon conserve l icone fournie', () => {
  assert.equal(getClientIcon('i-lucide-store'), 'i-lucide-store')
})
