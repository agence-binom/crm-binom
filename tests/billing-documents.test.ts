import assert from 'node:assert/strict'
import test from 'node:test'
import {
  billingDocumentCreateSchema,
  billingDocumentUpdateSchema,
  billingDocumentUploadMetadataSchema
} from '../app/validation/billing-documents'

test('billingDocumentCreateSchema accepte un statut valide pour le type', () => {
  const result = billingDocumentCreateSchema.safeParse({
    projectId: 7,
    documentType: 'quote',
    externalUrl: 'https://www.facture.net/376761/quotations/abc123',
    status: 'non_applicable'
  })

  assert.equal(result.success, true)
})

test('billingDocumentCreateSchema refuse un statut invalide pour le type', () => {
  const result = billingDocumentCreateSchema.safeParse({
    projectId: 7,
    documentType: 'commercial_proposal',
    status: 'non_applicable'
  })

  assert.equal(result.success, false)
})

test('billingDocumentCreateSchema refuse un sous-type sur un type non-facture', () => {
  const result = billingDocumentCreateSchema.safeParse({
    projectId: 7,
    documentType: 'quote',
    subtype: 'acompte',
    externalUrl: 'https://www.facture.net/376761/quotations/abc123'
  })

  assert.equal(result.success, false)
})

test('billingDocumentCreateSchema refuse un devis sans lien Facture.net', () => {
  const result = billingDocumentCreateSchema.safeParse({
    projectId: 7,
    documentType: 'quote',
    externalUrl: ''
  })

  assert.equal(result.success, false)
})

test('billingDocumentUploadMetadataSchema parse et normalise les métadonnées', () => {
  const result = billingDocumentUploadMetadataSchema.parse({
    projectId: '42',
    documentType: 'invoice',
    subtype: 'acompte',
    externalUrl: ' https://www.facture.net/376761/invoices/abc123 ',
    name: '  Acompte Avril 2026  ',
    description: '  30% à la commande  '
  })

  assert.deepEqual(result, {
    projectId: 42,
    documentType: 'invoice',
    subtype: 'acompte',
    externalUrl: 'https://www.facture.net/376761/invoices/abc123',
    name: 'Acompte Avril 2026',
    description: '30% à la commande'
  })
})

test('billingDocumentUpdateSchema exige au moins un champ', () => {
  const result = billingDocumentUpdateSchema.safeParse({})

  assert.equal(result.success, false)
})

test('billingDocumentUpdateSchema accepte une mise à jour partielle du statut', () => {
  const result = billingDocumentUpdateSchema.safeParse({ status: 'completed' })

  assert.equal(result.success, true)
})
