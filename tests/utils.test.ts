import assert from 'node:assert/strict'
import test from 'node:test'
import { getErrorMessage } from '../app/lib/utils'

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
