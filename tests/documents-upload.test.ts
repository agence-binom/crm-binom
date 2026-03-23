import assert from 'node:assert/strict'
import test from 'node:test'
import { documentMaxSizeBytes, documentUploadMetadataSchema } from '../app/validation/documents'
import {
  createDocumentInsertValues,
  getDocumentValidationError,
  sanitizeDocumentFilename,
  sanitizeDocumentPathSegment
} from '../server/lib/documents-upload'

test('getDocumentValidationError accepte un PDF valide', () => {
  const file = new File(['pdf-content'], 'devis.pdf', { type: 'application/pdf' })

  assert.equal(getDocumentValidationError(file), null)
})

test('getDocumentValidationError refuse un fichier vide', () => {
  const file = new File([], 'vide.pdf', { type: 'application/pdf' })

  assert.equal(getDocumentValidationError(file), 'Le fichier est vide')
})

test('getDocumentValidationError refuse un fichier trop volumineux', () => {
  const file = {
    size: documentMaxSizeBytes + 1,
    type: 'application/pdf'
  }

  assert.equal(
    getDocumentValidationError(file),
    'Le fichier dépasse la taille maximale autorisée de 10 Mo'
  )
})

test('getDocumentValidationError refuse un type MIME non supporté', () => {
  const file = new File(['text'], 'devis.txt', { type: 'text/plain' })

  assert.equal(getDocumentValidationError(file), 'Type de fichier non pris en charge')
})

test('documentUploadMetadataSchema parse et normalise les métadonnées', () => {
  const result = documentUploadMetadataSchema.parse({
    entityType: 'project',
    entityId: '42',
    documentType: 'quote',
    externalUrl: ' https://www.facture.net/376761/quotations/abc123 ',
    name: '  Devis Avril 2026  ',
    description: '  Version signée  '
  })

  assert.deepEqual(result, {
    entityType: 'project',
    entityId: 42,
    documentType: 'quote',
    externalUrl: 'https://www.facture.net/376761/quotations/abc123',
    name: 'Devis Avril 2026',
    description: 'Version signée'
  })
})

test('documentUploadMetadataSchema refuse un type de document invalide', () => {
  const result = documentUploadMetadataSchema.safeParse({
    entityType: 'project',
    entityId: '42',
    documentType: 'contract'
  })

  assert.equal(result.success, false)
})

test('documentUploadMetadataSchema refuse un devis sans lien Facture.net', () => {
  const result = documentUploadMetadataSchema.safeParse({
    entityType: 'project',
    entityId: '42',
    documentType: 'quote',
    externalUrl: ''
  })

  assert.equal(result.success, false)
})

test('documentUploadMetadataSchema refuse un lien hors Facture.net', () => {
  const result = documentUploadMetadataSchema.safeParse({
    entityType: 'project',
    entityId: '42',
    documentType: 'invoice',
    externalUrl: 'https://example.com/invoices/42'
  })

  assert.equal(result.success, false)
})

test('sanitizeDocumentPathSegment supprime accents et caractères spéciaux', () => {
  assert.equal(
    sanitizeDocumentPathSegment(' Société Démo / Avril 2026 '),
    'societe-demo-avril-2026'
  )
})

test('sanitizeDocumentFilename conserve une extension propre et ajoute un suffixe stable', () => {
  assert.equal(
    sanitizeDocumentFilename('Devis été 2026.FINAL.PDF', 'uuid-test'),
    'devis-ete-2026-final-uuid-test.pdf'
  )
})

test('createDocumentInsertValues construit les valeurs persistées avec fallback sur le nom du fichier', () => {
  const file = new File(['pdf-content'], 'document-source.pdf', { type: 'application/pdf' })
  const metadata = documentUploadMetadataSchema.parse({
    entityType: 'project',
    entityId: '7',
    documentType: 'invoice',
    externalUrl: 'https://www.facture.net/376761/invoices/fac-2026-001',
    name: '',
    description: '  facture finale  '
  })

  assert.deepEqual(
    createDocumentInsertValues(file, 'acme/factures/document-source.pdf', metadata),
    {
      name: 'document-source.pdf',
      filename: 'document-source.pdf',
      filepath: 'acme/factures/document-source.pdf',
      externalUrl: 'https://www.facture.net/376761/invoices/fac-2026-001',
      mimetype: 'application/pdf',
      size: file.size,
      entityType: 'project',
      entityId: 7,
      documentType: 'invoice',
      description: 'facture finale'
    }
  )
})
