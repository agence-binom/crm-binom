import assert from 'node:assert/strict'
import test from 'node:test'
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
