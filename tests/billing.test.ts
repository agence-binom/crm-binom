import assert from 'node:assert/strict'
import test from 'node:test'
import { buildBillingProjectStatus } from '../app/lib/billing'
import { computeProjectBillingSteps, getBillingStatus, type BillingDocumentLike } from '../app/lib/documents'

test('buildBillingProjectStatus dérive la cascade à partir des documents du projet', () => {
  const result = buildBillingProjectStatus({
    project: {
      id: 1,
      clientId: 10,
      name: 'Site vitrine',
      status: 'en_cours',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: null,
      requiresAcompte: true,
      client: {
        id: 10,
        name: 'Acme'
      }
    },
    documents: [
      { id: 1, projectId: 1, type: 'quote', status: 'completed', hasLink: true, hasFile: true },
      { id: 2, projectId: 1, type: 'invoice', subtype: 'acompte', status: 'completed', hasLink: true, hasFile: true },
      { id: 3, projectId: 1, type: 'invoice', subtype: 'unique', status: 'completed', hasLink: true, hasFile: true },
      { id: 4, projectId: 1, type: 'commercial_proposal', status: 'completed', hasLink: false, hasFile: true }
    ]
  })

  assert.deepEqual(result.billingSteps.map(step => step.status), ['completed', 'completed', 'completed', 'completed'])
  assert.equal(result.billingStatus.label, 'Clôturer facturé et payé')
})

const doc = (overrides: Partial<BillingDocumentLike> & Pick<BillingDocumentLike, 'id' | 'type' | 'status'>): BillingDocumentLike => ({
  lifecycle: 'current',
  subtype: null,
  ...overrides
})

test('computeProjectBillingSteps déroule le chemin complet quand tout est validé', () => {
  const steps = computeProjectBillingSteps([
    doc({ id: 1, type: 'commercial_proposal', status: 'completed' }),
    doc({ id: 2, type: 'quote', status: 'completed' }),
    doc({ id: 3, type: 'invoice', subtype: 'acompte', status: 'completed' }),
    doc({ id: 4, type: 'invoice', subtype: 'unique', status: 'completed' })
  ], true)

  assert.deepEqual(steps.map(step => step.status), ['completed', 'completed', 'completed', 'completed'])
  assert.equal(getBillingStatus(steps).label, 'Clôturer facturé et payé')
})

test('computeProjectBillingSteps active l\'étape suivante quand la précédente est validée', () => {
  const steps = computeProjectBillingSteps([
    doc({ id: 1, type: 'commercial_proposal', status: 'completed' })
  ], true)

  assert.equal(steps.find(step => step.key === 'quote')?.status, 'draft')
  assert.equal(getBillingStatus(steps).label, 'Devis à émettre')
})

test('un devis non applicable court-circuite l\'acompte et active directement la facture', () => {
  const steps = computeProjectBillingSteps([
    doc({ id: 1, type: 'commercial_proposal', status: 'completed' }),
    doc({ id: 2, type: 'quote', status: 'non_applicable' })
  ], true)

  assert.equal(steps.find(step => step.key === 'acompte')?.status, 'non_applicable')
  assert.equal(steps.find(step => step.key === 'invoice')?.status, 'draft')
})

test('requiresAcompte=false force l\'acompte en non applicable sans document réel', () => {
  const steps = computeProjectBillingSteps([
    doc({ id: 1, type: 'commercial_proposal', status: 'completed' }),
    doc({ id: 2, type: 'quote', status: 'completed' })
  ], false)

  assert.equal(steps.find(step => step.key === 'acompte')?.status, 'non_applicable')
  assert.equal(steps.find(step => step.key === 'acompte')?.documentId, null)
  assert.equal(steps.find(step => step.key === 'invoice')?.status, 'draft')
})

test('un document d\'acompte réel prime même quand requiresAcompte est désactivé', () => {
  const steps = computeProjectBillingSteps([
    doc({ id: 1, type: 'commercial_proposal', status: 'completed' }),
    doc({ id: 2, type: 'quote', status: 'completed' }),
    doc({ id: 3, type: 'invoice', subtype: 'acompte', status: 'sent' })
  ], false)

  assert.equal(steps.find(step => step.key === 'acompte')?.status, 'sent')
  assert.equal(steps.find(step => step.key === 'acompte')?.documentId, 3)
})

test('un acompte marqué non applicable active directement la facture', () => {
  const steps = computeProjectBillingSteps([
    doc({ id: 1, type: 'commercial_proposal', status: 'completed' }),
    doc({ id: 2, type: 'quote', status: 'completed' }),
    doc({ id: 3, type: 'invoice', subtype: 'acompte', status: 'non_applicable' })
  ], true)

  assert.equal(steps.find(step => step.key === 'acompte')?.status, 'non_applicable')
  assert.equal(steps.find(step => step.key === 'invoice')?.status, 'draft')
})

test('un devis refusé cascade en non applicable et déclenche le CTA "Sans suite"', () => {
  const steps = computeProjectBillingSteps([
    doc({ id: 1, type: 'commercial_proposal', status: 'completed' }),
    doc({ id: 2, type: 'quote', status: 'refused' })
  ], true)

  assert.equal(steps.find(step => step.key === 'acompte')?.status, 'non_applicable')
  assert.equal(steps.find(step => step.key === 'invoice')?.status, 'non_applicable')
  assert.equal(getBillingStatus(steps).label, 'Sans suite')
})
