import assert from 'node:assert/strict'
import test from 'node:test'
import { resourceCreateFormSchema, resourceCreateSchema, resourceEditFormSchema, resourceUpdateSchema } from '../app/validation/resources'

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

// Le formState des modals porte toujours url et content quel que soit le type : ce sont ces
// champs parasites qui faisaient échouer resourceUpdateSchema appliqué au formulaire entier.
const documentFormState = { type: 'document', projectId: 1, name: '', description: '', url: '', content: '' }

test('resourceCreateFormSchema accepte un document sans nom (plusieurs fichiers)', () => {
  const result = resourceCreateFormSchema.safeParse(documentFormState)

  assert.equal(result.success, true)
})

test('resourceCreateFormSchema refuse une description trop longue sur un document', () => {
  const result = resourceCreateFormSchema.safeParse({ ...documentFormState, description: 'a'.repeat(1001) })

  assert.equal(result.success, false)
})

test('resourceCreateFormSchema refuse un lien javascript: malgré les champs parasites', () => {
  const result = resourceCreateFormSchema.safeParse({
    type: 'link',
    projectId: 1,
    name: 'Cahier des charges',
    description: '',
    url: 'javascript:alert(1)',
    content: ''
  })

  assert.equal(result.success, false)
})

test('resourceEditFormSchema accepte une note dont le champ url masqué est vide', () => {
  const result = resourceEditFormSchema.safeParse({
    type: 'text',
    name: 'Compte rendu',
    description: '',
    url: '',
    content: 'Réunion du 12 mars'
  })

  assert.equal(result.success, true)
})

test('resourceEditFormSchema refuse un document sans nom', () => {
  const result = resourceEditFormSchema.safeParse({ ...documentFormState, projectId: undefined })

  assert.equal(result.success, false)
})
