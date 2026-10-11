import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildProjectFieldsFromBrief,
  getBriefProjectDiscrepancies,
  getEmptyProjectFieldsFromBrief,
  selectReusableAnswers
} from '../app/lib/brief-project'
import { extractBriefKeyFields } from '../app/lib/briefs'
import type { BriefAnswer } from '../app/validation/briefs'

const answer = (id: string, value: BriefAnswer['value'], extra: Partial<BriefAnswer> = {}): BriefAnswer => ({
  id, label: id, section: 'Projet', status: 'answered', value, ...extra
})

const briefFrom = (answers: BriefAnswer[]) => {
  const { summary, projectType, budgetRange, deadline, domain } = extractBriefKeyFields(answers)
  return { summary, projectType, budgetRange, deadline, domain }
}

const completeBrief = briefFrom([
  answer('project_type', 'ecommerce'),
  answer('budget_range', '6k_12k'),
  answer('deadline', '2026-12-15'),
  answer('deadline_context', 'Salon professionnel en janvier'),
  answer('goals', ['Vendre en ligne', 'Gagner du temps']),
  answer('decision_maker', 'La gérante'),
  answer('tools_to_connect', ['Stripe', 'Brevo']),
  answer('current_website', 'www.fleurs-de-rose.fr')
])

test('buildProjectFieldsFromBrief nomme le projet d’après son type et préremplit le projet', () => {
  const fields = buildProjectFieldsFromBrief(completeBrief)

  assert.equal(fields.name, 'Boutique en ligne')
  assert.equal(fields.url, 'https://fleurs-de-rose.fr')
  assert.equal(fields.endDate, '2026-12-15')
  assert.equal(fields.description, 'Objectifs :\n- Vendre en ligne\n- Gagner du temps\n\nContexte de l’échéance : Salon professionnel en janvier')
  assert.equal(
    fields.notes,
    'Issu du brief pré-rendez-vous :\n- Type de projet : Boutique en ligne\n- Budget : 6 à 12 k€\n- Décideur : La gérante\n- Outils à connecter : Stripe, Brevo'
  )
})

test('buildProjectFieldsFromBrief retombe sur « Nouveau projet » et ignore les « Je ne sais pas »', () => {
  const fields = buildProjectFieldsFromBrief(briefFrom([
    answer('project_type', null, { status: 'unknown' }),
    answer('goals', null, { status: 'unknown' }),
    answer('current_website', null, { status: 'unknown' })
  ]))

  assert.equal(fields.name, 'Nouveau projet')
  assert.equal(fields.description, null)
  assert.equal(fields.url, null)
  assert.equal(fields.endDate, null)
  assert.equal(fields.notes, null)
})

test('getEmptyProjectFieldsFromBrief ne remplit que les champs vides et trace ce qu’il remplit', () => {
  const fields = buildProjectFieldsFromBrief(completeBrief)
  const { updates, appliedFields } = getEmptyProjectFieldsFromBrief({
    description: 'Description saisie par nous',
    url: '',
    endDate: null,
    notes: '   '
  }, fields)

  assert.deepEqual(appliedFields, ['url', 'endDate', 'notes'])
  assert.equal(updates.description, undefined, 'jamais d’écrasement')
  assert.equal(updates.url, 'https://fleurs-de-rose.fr')
  assert.equal(updates.endDate, '2026-12-15')
})

test('getEmptyProjectFieldsFromBrief ne touche à rien sur un projet déjà complet', () => {
  const fields = buildProjectFieldsFromBrief(completeBrief)
  const { updates, appliedFields } = getEmptyProjectFieldsFromBrief({
    description: 'x', url: 'https://autre.fr', endDate: new Date('2027-01-01'), notes: 'y'
  }, fields)

  assert.deepEqual(appliedFields, [])
  assert.deepEqual(updates, {})
})

test('getEmptyProjectFieldsFromBrief n’écrit pas une valeur absente du brief', () => {
  const { appliedFields } = getEmptyProjectFieldsFromBrief({}, buildProjectFieldsFromBrief(briefFrom([])))
  assert.deepEqual(appliedFields, [])
})

test('getBriefProjectDiscrepancies signale un site et une échéance différents de ceux du projet', () => {
  const ids = getBriefProjectDiscrepancies(
    { domain: 'fleurs-de-rose.fr', deadline: '2026-12-15' },
    { url: 'https://www.autre-site.fr', endDate: new Date(2027, 0, 10) }
  ).map(alert => alert.id)

  assert.deepEqual(ids, ['project-url-mismatch', 'project-deadline-mismatch'])
})

test('getBriefProjectDiscrepancies ne signale rien quand le projet concorde ou n’a pas la donnée', () => {
  assert.deepEqual(getBriefProjectDiscrepancies(
    { domain: 'fleurs-de-rose.fr', deadline: '2026-12-15' },
    { url: 'https://www.fleurs-de-rose.fr/accueil', endDate: new Date(2026, 11, 15) }
  ), [])
  assert.deepEqual(getBriefProjectDiscrepancies({ domain: 'a.fr', deadline: '2026-12-15' }, { url: null, endDate: null }), [])
  assert.deepEqual(getBriefProjectDiscrepancies({ domain: 'a.fr', deadline: null }, null), [])
})

test('selectReusableAnswers ne reprend que la partie technique, « Je ne sais pas » compris', () => {
  const reusable = selectReusableAnswers([
    answer('project_type', 'redesign'),
    answer('budget_range', '6k_12k'),
    answer('current_website', 'https://boulangerie-martin.fr', { label: 'Site actuel', section: 'Site' }),
    answer('domain_registrar', null, { status: 'unknown' }),
    answer('access_availability', 'to_find'),
    answer('tools_to_connect', ['SumUp']),
    answer('inspirations', 'Un site que j’aime')
  ])

  assert.deepEqual(reusable, [
    { id: 'current_website', status: 'answered', value: 'https://boulangerie-martin.fr' },
    { id: 'domain_registrar', status: 'unknown' },
    { id: 'access_availability', status: 'answered', value: 'to_find' },
    { id: 'tools_to_connect', status: 'answered', value: ['SumUp'] }
  ])
  assert.deepEqual(selectReusableAnswers(null), [])
})
