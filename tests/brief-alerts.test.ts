import assert from 'node:assert/strict'
import test from 'node:test'
import { getBriefAlerts, namesLookAlike } from '../app/lib/brief-alerts'
import type { BriefEnrichment, BriefSummary } from '../app/types/brief'

const now = new Date('2026-10-11T09:00:00Z')

const alertIds = (summary: BriefSummary | null, enrichment: BriefEnrichment | null = null) => (
  getBriefAlerts({ summary, enrichment }, now).map(alert => alert.id)
)

test('aucune alerte pour un brief sans risque particulier', () => {
  assert.deepEqual(alertIds({
    accessAvailability: { status: 'answered', value: 'all' },
    siteManager: { status: 'answered', value: 'internal' },
    domainEmails: { status: 'answered', value: false },
    deadline: { status: 'answered', value: '2027-06-01' }
  }, { domain: 'exemple.fr', mxHosts: [] }), [])
  assert.deepEqual(alertIds(null), [])
})

test('signale les emails hébergés sur le domaine, déclarés ou détectés', () => {
  assert.deepEqual(alertIds({ domainEmails: { status: 'answered', value: true } }), ['domain-emails'])
  assert.deepEqual(alertIds({}, { domain: 'exemple.fr', mxHosts: ['mx1.mail.ovh.net'], emailProvider: 'OVHcloud' }), ['domain-emails'])
})

test('signale un écart quand le prospect déclare ne pas avoir d’emails mais que des MX existent', () => {
  assert.deepEqual(
    alertIds({ domainEmails: { status: 'answered', value: false } }, { domain: 'exemple.fr', mxHosts: ['aspmx.l.google.com'] }),
    ['domain-emails-mismatch']
  )
})

test('signale les accès partiels, à retrouver ou inconnus', () => {
  assert.deepEqual(alertIds({ accessAvailability: { status: 'answered', value: 'partial' } }), ['access'])
  assert.deepEqual(alertIds({ accessAvailability: { status: 'answered', value: 'to_find' } }), ['access'])
  assert.deepEqual(alertIds({ accessAvailability: { status: 'answered', value: 'unknown' } }), ['access'])
  assert.deepEqual(alertIds({ accessAvailability: { status: 'unknown' } }), ['access'])
})

test('signale un ancien prestataire et un prestataire non informé', () => {
  assert.deepEqual(alertIds({ siteManager: { status: 'answered', value: 'former_provider' } }), ['former-provider'])
  assert.deepEqual(alertIds({
    siteManager: { status: 'answered', value: 'current_provider' },
    providerInformed: { status: 'answered', value: false }
  }), ['provider-not-informed'])
  assert.deepEqual(alertIds({
    siteManager: { status: 'answered', value: 'current_provider' },
    providerInformed: { status: 'answered', value: true }
  }), [])
})

test('signale une échéance proche, mais pas une échéance lointaine', () => {
  assert.deepEqual(alertIds({ deadline: { status: 'answered', value: '2026-11-15' } }), ['deadline-soon'])
  assert.deepEqual(alertIds({ deadline: { status: 'answered', value: '2026-10-11' } }), ['deadline-soon'])
  assert.deepEqual(alertIds({ deadline: { status: 'answered', value: '2026-12-11' } }), [])
  assert.deepEqual(alertIds({ deadline: { status: 'answered', value: '2026-09-01' } }), ['deadline-passed'])
})

test('signale un bureau d’enregistrement différent de celui déclaré', () => {
  assert.deepEqual(alertIds(
    { domainRegistrar: { status: 'answered', value: 'Gandi' } },
    { domain: 'exemple.fr', registrar: 'OVH, SAS' }
  ), ['registrar-mismatch'])
  assert.deepEqual(alertIds(
    { domainRegistrar: { status: 'answered', value: 'OVH' } },
    { domain: 'exemple.fr', registrar: 'OVH, SAS' }
  ), [])
})

test('signale un hébergeur email différent de celui déclaré', () => {
  const ids = alertIds(
    { domainEmails: { status: 'answered', value: true }, emailProvider: { status: 'answered', value: 'Gmail' } },
    { domain: 'exemple.fr', mxHosts: ['mx.ovh.net'], emailProvider: 'OVHcloud' }
  )
  assert.deepEqual(ids, ['domain-emails', 'email-provider-mismatch'])
})

test('namesLookAlike tolère les variations de raison sociale sans confondre deux prestataires', () => {
  assert.equal(namesLookAlike('GoDaddy', 'GoDaddy.com, LLC'), true)
  assert.equal(namesLookAlike('ovhcloud', 'OVH SAS'), true)
  assert.equal(namesLookAlike('Google', 'Google Workspace'), true)
  assert.equal(namesLookAlike('Gandi SAS', 'OVH SAS'), false)
  assert.equal(namesLookAlike('ionos.com', 'Hostinger'), false)
})
