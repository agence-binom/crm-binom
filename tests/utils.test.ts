import assert from 'node:assert/strict'
import test from 'node:test'
import { formatRelativeTime, getErrorMessage } from '../app/lib/utils'

test('getErrorMessage retourne statusMessage à la racine', () => {
  assert.equal(
    getErrorMessage({ statusMessage: 'Accès refusé' }, 'Erreur inconnue'),
    'Accès refusé'
  )
})

test('getErrorMessage retourne statusMessage dans data', () => {
  assert.equal(
    getErrorMessage({ data: { statusMessage: 'Ressource introuvable' } }, 'Erreur inconnue'),
    'Ressource introuvable'
  )
})

test('getErrorMessage priorise statusMessage à la racine sur celui de data', () => {
  assert.equal(
    getErrorMessage(
      {
        statusMessage: 'Message racine',
        data: { statusMessage: 'Message data' }
      },
      'Erreur inconnue'
    ),
    'Message racine'
  )
})

test('getErrorMessage ignore un statusMessage vide et utilise le fallback disponible', () => {
  assert.equal(
    getErrorMessage(
      {
        statusMessage: '',
        data: { statusMessage: 'Message data' }
      },
      'Erreur inconnue'
    ),
    'Message data'
  )
})

test('getErrorMessage retourne le message Error en fallback', () => {
  assert.equal(
    getErrorMessage(new Error('Connexion expirée'), 'Erreur inconnue'),
    'Connexion expirée'
  )
})

test('getErrorMessage retourne le fallback si aucun message exploitable', () => {
  assert.equal(
    getErrorMessage({ foo: 'bar' }, 'Erreur inconnue'),
    'Erreur inconnue'
  )
})

test('formatRelativeTime utilise la forme courte pour les minutes et les heures', () => {
  const now = new Date('2026-09-30T12:00:00Z')

  assert.equal(formatRelativeTime('2026-09-30T11:59:30Z', now), 'à l\'instant')
  assert.equal(formatRelativeTime('2026-09-30T11:55:00Z', now), 'il y a 5 min')
  assert.equal(formatRelativeTime('2026-09-30T10:00:00Z', now), 'il y a 2 h')
})

test('formatRelativeTime tronque au lieu d\'arrondir', () => {
  const now = new Date('2026-09-30T12:00:00Z')

  assert.equal(formatRelativeTime('2026-09-30T11:00:20Z', now), 'il y a 59 min')
})

test('formatRelativeTime passe à la forme longue au-delà d\'un jour', () => {
  const now = new Date('2026-09-30T12:00:00Z')

  assert.equal(formatRelativeTime('2026-09-29T12:00:00Z', now), 'hier')
  assert.equal(formatRelativeTime('2026-09-27T12:00:00Z', now), 'il y a 3 jours')
  assert.equal(formatRelativeTime('2024-09-01T12:00:00Z', now), 'il y a 2 ans')
})
