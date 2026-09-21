import assert from 'node:assert/strict'
import test from 'node:test'
import {
  defaultClientIcon,
  getClientIcon
} from '../app/lib/clients'
import { clientCreateSchema, clientUpdateSchema, clientsDashboardQuerySchema } from '../app/validation/clients'
import { getProspectionStatusSideEffects, getStatusAdvanceFromDateEntry } from '../app/lib/prospection'

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

test('clientCreateSchema archive a false par defaut', () => {
  const result = clientCreateSchema.parse({
    name: 'Client test'
  })

  assert.equal(result.archived, false)
})

test('clientCreateSchema conserve archived a true si fourni', () => {
  const result = clientCreateSchema.parse({
    name: 'Client test',
    archived: true
  })

  assert.equal(result.archived, true)
})

test('clientsDashboardQuerySchema retourne false par defaut sans parametre', () => {
  const result = clientsDashboardQuerySchema.parse({})

  assert.equal(result.archived, false)
})

test('clientsDashboardQuerySchema interprete correctement les chaines "true" et "false"', () => {
  assert.equal(clientsDashboardQuerySchema.parse({ archived: 'false' }).archived, false)
  assert.equal(clientsDashboardQuerySchema.parse({ archived: 'true' }).archived, true)
})

test('getClientIcon retourne l icone par defaut si aucune valeur n est fournie', () => {
  assert.equal(getClientIcon(undefined), defaultClientIcon)
  assert.equal(getClientIcon(null), defaultClientIcon)
  assert.equal(getClientIcon(''), defaultClientIcon)
})

test('getClientIcon conserve l icone fournie', () => {
  assert.equal(getClientIcon('i-lucide-store'), 'i-lucide-store')
})

test('getProspectionStatusSideEffects horodate contactedAt en entrant dans "contacte"', () => {
  const now = new Date('2026-03-25T10:00:00.000Z')

  const result = getProspectionStatusSideEffects('contacte', now)

  assert.equal(result.contactedAt, now)
  assert.equal(result.relancedAt, undefined)
  assert.equal(result.archived, false)
})

test('getProspectionStatusSideEffects horodate relancedAt en entrant dans "a_relancer"', () => {
  const now = new Date('2026-03-25T10:00:00.000Z')

  const result = getProspectionStatusSideEffects('a_relancer', now)

  assert.equal(result.relancedAt, now)
  assert.equal(result.contactedAt, undefined)
  assert.equal(result.archived, false)
})

test('getProspectionStatusSideEffects archive automatiquement en entrant dans "perdu"', () => {
  const result = getProspectionStatusSideEffects('perdu')

  assert.equal(result.archived, true)
})

test('getProspectionStatusSideEffects desarchive en sortant de "perdu"', () => {
  const result = getProspectionStatusSideEffects('negociation')

  assert.equal(result.archived, false)
})

test('getStatusAdvanceFromDateEntry fait avancer vers "contacte" quand on ajoute contactedAt', () => {
  const result = getStatusAdvanceFromDateEntry('nouveau', { contactedAtAdded: true })

  assert.equal(result, 'contacte')
})

test('getStatusAdvanceFromDateEntry fait avancer vers "a_relancer" quand on ajoute relancedAt', () => {
  const result = getStatusAdvanceFromDateEntry('nouveau', { relancedAtAdded: true })

  assert.equal(result, 'a_relancer')
})

test('getStatusAdvanceFromDateEntry privilegie "a_relancer" si les deux dates sont ajoutees ensemble', () => {
  const result = getStatusAdvanceFromDateEntry('nouveau', { contactedAtAdded: true, relancedAtAdded: true })

  assert.equal(result, 'a_relancer')
})

test('getStatusAdvanceFromDateEntry ne fait jamais reculer un statut deja plus avance', () => {
  assert.equal(getStatusAdvanceFromDateEntry('negociation', { contactedAtAdded: true }), null)
  assert.equal(getStatusAdvanceFromDateEntry('negociation', { relancedAtAdded: true }), null)
})

test('getStatusAdvanceFromDateEntry ne fait rien sans date ajoutee', () => {
  assert.equal(getStatusAdvanceFromDateEntry('nouveau', {}), null)
})

test('clientUpdateSchema accepte une date de contact et de relance', () => {
  const result = clientUpdateSchema.parse({
    contactedAt: '2026-03-25',
    relancedAt: '2026-03-26'
  })

  assert.ok(result.contactedAt instanceof Date)
  assert.ok(result.relancedAt instanceof Date)
})

test('clientUpdateSchema distingue une date effacee (null) d\'un champ omis (undefined)', () => {
  const cleared = clientUpdateSchema.parse({ contactedAt: null })
  assert.equal(cleared.contactedAt, null)

  const omitted = clientUpdateSchema.parse({ name: 'Client test' })
  assert.equal(omitted.contactedAt, undefined)
})
