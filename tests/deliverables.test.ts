import assert from 'node:assert/strict'
import test from 'node:test'
import { deliverableCreateSchema, deliverableUpdateSchema } from '../app/validation/deliverables'

test('deliverableCreateSchema accepte un lien http(s) valide', () => {
  const result = deliverableCreateSchema.safeParse({
    type: 'link',
    projectId: 1,
    name: 'Maquette Figma',
    url: 'https://example.com/maquette.pdf'
  })

  assert.equal(result.success, true)
})

test('deliverableCreateSchema refuse un lien javascript:', () => {
  const result = deliverableCreateSchema.safeParse({
    type: 'link',
    projectId: 1,
    name: 'Maquette Figma',
    url: 'javascript:alert(1)'
  })

  assert.equal(result.success, false)
})

test('deliverableCreateSchema refuse un lien data:', () => {
  const result = deliverableCreateSchema.safeParse({
    type: 'link',
    projectId: 1,
    name: 'Maquette Figma',
    url: 'data:text/html,<script>alert(1)</script>'
  })

  assert.equal(result.success, false)
})

test('deliverableUpdateSchema refuse un lien javascript:', () => {
  const result = deliverableUpdateSchema.safeParse({
    url: 'javascript:alert(1)'
  })

  assert.equal(result.success, false)
})
