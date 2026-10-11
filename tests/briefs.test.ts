import assert from 'node:assert/strict'
import test from 'node:test'
import {
  describeBriefKeyField,
  extractBriefKeyFields,
  formatBriefAnswerValue,
  getBriefBudgetRangeLabel,
  getBriefDisplayStatus,
  getBriefExpiresAt,
  getBriefLinkState,
  getBriefProjectTypeLabel,
  groupBriefAnswersBySection,
  normalizeDomain
} from '../app/lib/briefs'
import { briefBudgetRanges, briefProjectTypes } from '../app/constants/briefs'
import { briefCreateSchema, briefSubmissionSchema, briefTokenSchema } from '../app/validation/briefs'
import type { BriefAnswer } from '../app/validation/briefs'

const now = new Date('2026-10-11T12:00:00Z')

test('getBriefLinkState accepte un lien envoyé ou ouvert avant son expiration', () => {
  assert.equal(getBriefLinkState({ status: 'sent', expiresAt: '2026-10-12T12:00:00Z' }, now), 'valid')
  assert.equal(getBriefLinkState({ status: 'opened', expiresAt: new Date('2026-10-11T12:00:01Z') }, now), 'valid')
})

test('getBriefLinkState considère un lien expiré dès l’instant exact de son échéance', () => {
  assert.equal(getBriefLinkState({ status: 'sent', expiresAt: '2026-10-11T12:00:00Z' }, now), 'expired')
  assert.equal(getBriefLinkState({ status: 'opened', expiresAt: '2026-10-01T00:00:00Z' }, now), 'expired')
})

test('getBriefLinkState garde un brief complété comme tel, même une fois son lien périmé', () => {
  assert.equal(getBriefLinkState({ status: 'completed', expiresAt: '2026-10-12T00:00:00Z' }, now), 'completed')
  assert.equal(getBriefLinkState({ status: 'completed', expiresAt: '2020-01-01T00:00:00Z' }, now), 'completed')
})

test('getBriefDisplayStatus déduit « expiré » sans jamais le stocker', () => {
  assert.equal(getBriefDisplayStatus({ status: 'opened', expiresAt: '2026-10-01T00:00:00Z' }, now), 'expired')
  assert.equal(getBriefDisplayStatus({ status: 'opened', expiresAt: '2026-11-01T00:00:00Z' }, now), 'opened')
  assert.equal(getBriefDisplayStatus({ status: 'completed', expiresAt: '2026-10-01T00:00:00Z' }, now), 'completed')
})

test('getBriefExpiresAt ajoute le nombre de jours demandé', () => {
  assert.equal(getBriefExpiresAt(30, now).toISOString(), '2026-11-10T12:00:00.000Z')
})

test('briefCreateSchema applique une validité de 30 jours par défaut et borne la durée', () => {
  assert.equal(briefCreateSchema.parse({}).expiresInDays, 30)
  assert.equal(briefCreateSchema.safeParse({ expiresInDays: 0 }).success, false)
  assert.equal(briefCreateSchema.safeParse({ expiresInDays: 181 }).success, false)
})

test('briefTokenSchema refuse un jeton trop court ou avec des caractères hors base64url', () => {
  assert.equal(briefTokenSchema.safeParse({ token: 'a'.repeat(43) }).success, true)
  assert.equal(briefTokenSchema.safeParse({ token: 'abc' }).success, false)
  assert.equal(briefTokenSchema.safeParse({ token: `${'a'.repeat(40)}/../x` }).success, false)
})

const answer = (id: string, value: BriefAnswer['value'], extra: Partial<BriefAnswer> = {}): BriefAnswer => ({
  id, label: id, section: 'Projet', status: 'answered', value, ...extra
})

test('briefSubmissionSchema accepte une question inconnue du CRM et la conserve telle quelle', () => {
  const payload = {
    formVersion: '2026-10',
    answers: [answer('favorite_color', 'Vert sapin', { section: 'Nouvelle section', label: 'Couleur préférée ?' })]
  }
  const parsed = briefSubmissionSchema.parse(payload)
  assert.deepEqual(parsed.answers[0], payload.answers[0])
})

test('briefSubmissionSchema refuse une enveloppe invalide', () => {
  assert.equal(briefSubmissionSchema.safeParse({ answers: [] }).success, false, 'formVersion manquant')
  assert.equal(briefSubmissionSchema.safeParse({ formVersion: '1', answers: [{ id: 'x', label: 'x', status: 'maybe' }] }).success, false, 'statut inconnu')
  assert.equal(briefSubmissionSchema.safeParse({ formVersion: '1', answers: 'oui' }).success, false, 'answers non tableau')
})

test('briefSubmissionSchema refuse deux réponses pour la même question', () => {
  const result = briefSubmissionSchema.safeParse({ formVersion: '1', answers: [answer('goals', 'a'), answer('goals', 'b')] })
  assert.equal(result.success, false)
})

test('extractBriefKeyFields extrait les champs clés et le domaine du site actuel', () => {
  const extracted = extractBriefKeyFields([
    answer('project_type', 'redesign'),
    answer('budget_range', '6k_12k'),
    answer('deadline', '2027-01-15'),
    answer('goals', ['Plus de demandes de devis', 'Image plus moderne']),
    answer('current_website', 'https://www.Exemple-Boulangerie.fr/accueil'),
    answer('domain_emails', 'oui'),
    answer('provider_informed', false)
  ])

  assert.equal(extracted.projectType, 'redesign')
  assert.equal(extracted.budgetRange, '6k_12k')
  assert.equal(extracted.deadline, '2027-01-15')
  assert.equal(extracted.domain, 'exemple-boulangerie.fr')
  assert.deepEqual(extracted.summary.goals, { status: 'answered', value: ['Plus de demandes de devis', 'Image plus moderne'] })
  assert.deepEqual(extracted.summary.domainEmails, { status: 'answered', value: true })
  assert.deepEqual(extracted.summary.providerInformed, { status: 'answered', value: false })
})

test('extractBriefKeyFields distingue « Je ne sais pas » d’une question sans réponse', () => {
  const { summary, budgetRange } = extractBriefKeyFields([
    answer('budget_range', null, { status: 'unknown' })
  ])

  assert.deepEqual(summary.budgetRange, { status: 'unknown' })
  assert.equal(budgetRange, null)
  assert.equal('projectType' in summary, false, 'question absente = clé absente')
  assert.equal(describeBriefKeyField(summary.budgetRange, String).state, 'unknown')
  assert.equal(describeBriefKeyField(summary.projectType, String).state, 'missing')
})

test('extractBriefKeyFields ignore une valeur hors liste sans faire échouer la soumission', () => {
  const extracted = extractBriefKeyFields([
    answer('project_type', 'application_mobile'),
    answer('budget_range', '100k'),
    answer('deadline', '2027-02-30'),
    answer('current_website', 'pas de site')
  ])

  assert.equal(extracted.projectType, null)
  assert.equal(extracted.budgetRange, null)
  assert.equal(extracted.deadline, null, 'date impossible')
  assert.equal(extracted.domain, null)
  assert.equal('projectType' in extracted.summary, false)
})

test('extractBriefKeyFields traite une réponse vide comme une absence de réponse', () => {
  const { summary } = extractBriefKeyFields([answer('decision_maker', '   '), answer('tools_to_connect', [])])
  assert.deepEqual(summary, {})
})

test('normalizeDomain renvoie le domaine nu et refuse IP, localhost et saisies libres', () => {
  assert.equal(normalizeDomain('exemple.fr'), 'exemple.fr')
  assert.equal(normalizeDomain(' https://WWW.exemple.co.uk/page?x=1 '), 'exemple.co.uk')
  assert.equal(normalizeDomain('http://sub.exemple.fr:8080'), 'sub.exemple.fr')
  assert.equal(normalizeDomain('192.168.1.10'), null)
  assert.equal(normalizeDomain('localhost'), null)
  assert.equal(normalizeDomain('je ne sais pas'), null)
  assert.equal(normalizeDomain(''), null)
  assert.equal(normalizeDomain(null), null)
})

test('formatBriefAnswerValue rend chaque type de réponse lisible', () => {
  assert.equal(formatBriefAnswerValue(true), 'Oui')
  assert.equal(formatBriefAnswerValue(false), 'Non')
  assert.equal(formatBriefAnswerValue(['Stripe', 'Brevo']), 'Stripe, Brevo')
  assert.equal(formatBriefAnswerValue(12), '12')
  assert.equal(formatBriefAnswerValue(null), '-')
  assert.equal(formatBriefAnswerValue(''), '-')
})

test('groupBriefAnswersBySection garde l’ordre du formulaire et regroupe les réponses sans section', () => {
  const groups = groupBriefAnswersBySection([
    answer('a', '1', { section: 'Projet' }),
    answer('b', '2', { section: 'Technique' }),
    answer('c', '3', { section: 'Projet' }),
    answer('d', '4', { section: null })
  ])

  assert.deepEqual(groups.map(group => group.title), ['Projet', 'Technique', 'Autres réponses'])
  assert.deepEqual(groups[0]!.answers.map(item => item.id), ['a', 'c'])
})

test('chaque type de projet et chaque budget a un libellé français dédié', () => {
  const projectLabels = briefProjectTypes.map(getBriefProjectTypeLabel)
  const budgetLabels = briefBudgetRanges.map(getBriefBudgetRangeLabel)
  assert.equal(new Set(projectLabels).size, briefProjectTypes.length)
  assert.equal(new Set(budgetLabels).size, briefBudgetRanges.length)
})
