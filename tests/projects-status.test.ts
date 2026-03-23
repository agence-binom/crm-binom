import assert from 'node:assert/strict'
import test from 'node:test'
import { getProjectDisplayStatus, toProjectInputDate } from '../app/lib/projects'

test('toProjectInputDate formate une date ISO pour un champ date HTML', () => {
  assert.equal(
    toProjectInputDate('2025-06-15T00:00:00.000Z'),
    '2025-06-15'
  )
})

test('getProjectDisplayStatus marque un projet comme termine si la date de fin est passee', () => {
  assert.equal(
    getProjectDisplayStatus(
      {
        status: 'en_cours',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-12-31T00:00:00.000Z'
      },
      new Date('2026-03-23T10:00:00.000Z')
    ),
    'termine'
  )
})

test('getProjectDisplayStatus marque un projet comme en attente si le debut est dans le futur', () => {
  assert.equal(
    getProjectDisplayStatus(
      {
        status: 'en_cours',
        startDate: '2026-05-01T00:00:00.000Z',
        endDate: null
      },
      new Date('2026-03-23T10:00:00.000Z')
    ),
    'en_attente'
  )
})

test('getProjectDisplayStatus preserve le statut annule', () => {
  assert.equal(
    getProjectDisplayStatus(
      {
        status: 'annule',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-12-31T00:00:00.000Z'
      },
      new Date('2026-03-23T10:00:00.000Z')
    ),
    'annule'
  )
})
