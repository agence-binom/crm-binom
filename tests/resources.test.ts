import assert from 'node:assert/strict'
import test from 'node:test'
import { resourceCreateSchema, resourceUpdateSchema } from '../app/validation/resources'

test('resourceCreateSchema accepte un lien http(s) valide', () => {
  const result = resourceCreateSchema.safeParse({
    type: 'link',
    projectId: 1,
    name: 'Cahier des charges',
    url: 'https://example.com/doc.pdf'
  })

  assert.equal(result.success, true)
})

test('resourceCreateSchema refuse un lien javascript:', () => {
  const result = resourceCreateSchema.safeParse({
    type: 'link',
    projectId: 1,
    name: 'Cahier des charges',
    url: 'javascript:alert(1)'
  })

  assert.equal(result.success, false)
})

test('resourceCreateSchema refuse un lien data:', () => {
  const result = resourceCreateSchema.safeParse({
    type: 'link',
    projectId: 1,
    name: 'Cahier des charges',
    url: 'data:text/html,<script>alert(1)</script>'
  })

  assert.equal(result.success, false)
})

test('resourceUpdateSchema refuse un lien javascript:', () => {
  const result = resourceUpdateSchema.safeParse({
    url: 'javascript:alert(1)'
  })

  assert.equal(result.success, false)
})
