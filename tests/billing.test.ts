import assert from 'node:assert/strict'
import test from 'node:test'
import { buildBillingProjectStatus, getBillingCoverage } from '../app/lib/billing'

test('getBillingCoverage retourne un statut none sans document', () => {
  assert.deepEqual(
    getBillingCoverage(0, []),
    {
      total: 0,
      withLinkCount: 0,
      missingLinkCount: 0,
      status: 'none',
      stage: 'none'
    }
  )
})

test('getBillingCoverage retourne un statut partial quand des liens manquent', () => {
  assert.deepEqual(
    getBillingCoverage(3, [
      { id: 1, projectId: 1, name: 'Quote 1', type: 'quote', status: 'draft', hasLink: true, lifecycle: 'current', supersededByDocumentId: null },
      { id: 2, projectId: 1, name: 'Quote 2', type: 'quote', status: 'sent', hasLink: false, lifecycle: 'current', supersededByDocumentId: null }
    ]),
    {
      total: 3,
      withLinkCount: 1,
      missingLinkCount: 1,
      status: 'partial',
      stage: 'sent'
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
    invoiceTotal: 2,
    proposalTotal: 1,
    documents: [
      { id: 1, projectId: 1, name: 'Quote', type: 'quote', status: 'completed', hasLink: true },
      { id: 2, projectId: 1, name: 'Invoice 1', type: 'invoice', status: 'completed', hasLink: true },
      { id: 3, projectId: 1, name: 'Invoice 2', type: 'invoice', status: 'completed', hasLink: true },
      { id: 4, projectId: 1, name: 'Proposal', type: 'commercial_proposal', status: 'completed', hasLink: false }
    ]
  })

  assert.equal(result.totalDocuments, 4)
  assert.equal(result.missingLinkCount, 0)
  assert.equal(result.isComplete, true)
  assert.equal(result.quoteCoverage.status, 'complete')
  assert.equal(result.invoiceCoverage.status, 'complete')
})
