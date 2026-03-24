import assert from 'node:assert/strict'
import test from 'node:test'
import { buildBillingProjectStatus, getBillingCoverage } from '../app/lib/billing'

test('getBillingCoverage retourne un statut none sans document', () => {
  assert.deepEqual(
    getBillingCoverage(0, 0),
    {
      total: 0,
      withLinkCount: 0,
      missingLinkCount: 0,
      status: 'none'
    }
  )
})

test('getBillingCoverage retourne un statut partial quand des liens manquent', () => {
  assert.deepEqual(
    getBillingCoverage(3, 1),
    {
      total: 3,
      withLinkCount: 1,
      missingLinkCount: 2,
      status: 'partial'
    }
  )
})

test('buildBillingProjectStatus marque un projet comme complet quand devis et facture ont tous leurs liens', () => {
  const result = buildBillingProjectStatus({
    project: {
      id: 1,
      clientId: 10,
      name: 'Site vitrine',
      status: 'en_cours',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: null,
      client: {
        id: 10,
        name: 'Acme'
      }
    },
    quoteTotal: 1,
    quoteWithLinkCount: 1,
    invoiceTotal: 2,
    invoiceWithLinkCount: 2
  })

  assert.equal(result.totalDocuments, 3)
  assert.equal(result.missingLinkCount, 0)
  assert.equal(result.isComplete, true)
  assert.equal(result.quoteCoverage.status, 'complete')
  assert.equal(result.invoiceCoverage.status, 'complete')
})
