import {
  briefAccessAvailabilities,
  briefBudgetRanges,
  briefKeyAnswerIds,
  briefProjectTypes,
  briefSiteManagers,
  type BriefAccessAvailability,
  type BriefBudgetRange,
  type BriefDisplayStatus,
  type BriefProjectType,
  type BriefSiteManager,
  type BriefStatus
} from '../constants/briefs'
import type { BriefKeyField, BriefSummary } from '../types/brief'
import type { BriefAnswer, BriefAnswerValue } from '../validation/briefs'

type BriefLinkInput = { status: BriefStatus, expiresAt: Date | string }

export type BriefLinkState = 'valid' | 'expired' | 'completed'

// Complété prime sur expiré : un brief reçu reste « complété » même une fois son lien périmé.
export function getBriefLinkState(brief: BriefLinkInput, now = new Date()): BriefLinkState {
  if (brief.status === 'completed') return 'completed'
  return new Date(brief.expiresAt).getTime() <= now.getTime() ? 'expired' : 'valid'
}

export function getBriefDisplayStatus(brief: BriefLinkInput, now = new Date()): BriefDisplayStatus {
  return getBriefLinkState(brief, now) === 'expired' ? 'expired' : brief.status
}

export function getBriefExpiresAt(expiresInDays: number, now = new Date()) {
  return new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
}

export function getBriefDisplayStatusLabel(status: BriefDisplayStatus) {
  switch (status) {
    case 'opened': return 'Ouvert'
    case 'completed': return 'Complété'
    case 'expired': return 'Expiré'
    default: return 'Envoyé'
  }
}

export function getBriefDisplayStatusColor(status: BriefDisplayStatus) {
  switch (status) {
    case 'opened': return 'info' as const
    case 'completed': return 'success' as const
    case 'expired': return 'neutral' as const
    default: return 'warning' as const
  }
}

export function getBriefProjectTypeLabel(projectType: BriefProjectType) {
  switch (projectType) {
    case 'showcase_site': return 'Création de site vitrine'
    case 'redesign': return 'Refonte'
    case 'ecommerce': return 'Boutique en ligne'
    case 'feature': return 'Fonctionnalité sur site existant'
    case 'internal_tool': return 'Outil interne'
    default: return 'Autre'
  }
}

export function getBriefBudgetRangeLabel(budgetRange: BriefBudgetRange) {
  switch (budgetRange) {
    case 'lt_3k': return 'Moins de 3 k€'
    case '3k_6k': return '3 à 6 k€'
    case '6k_12k': return '6 à 12 k€'
    case '12k_25k': return '12 à 25 k€'
    case 'gt_25k': return 'Plus de 25 k€'
    default: return 'Besoin d’être conseillé'
  }
}

export function getBriefSiteManagerLabel(siteManager: BriefSiteManager) {
  switch (siteManager) {
    case 'internal': return 'En interne'
    case 'current_provider': return 'Prestataire actuel'
    case 'former_provider': return 'Ancien prestataire'
    default: return 'Personne'
  }
}

export function getBriefAccessAvailabilityLabel(accessAvailability: BriefAccessAvailability) {
  switch (accessAvailability) {
    case 'all': return 'Tous les accès'
    case 'partial': return 'Une partie des accès'
    case 'to_find': return 'Accès à retrouver'
    default: return 'Ne sait pas'
  }
}

const hostnamePattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/

// Accepte « exemple.fr », « www.exemple.fr » ou une URL complète, et renvoie le domaine nu. Les IP
// et les noms sans TLD sont refusés : ils n'ont rien à enrichir et ouvriraient la porte à des
// requêtes vers le réseau interne (voir server/lib/brief-enrichment.ts).
export function normalizeDomain(input: string | null | undefined) {
  const trimmed = input?.trim().toLowerCase()
  if (!trimmed) return null

  let hostname: string
  try {
    hostname = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`).hostname
  } catch {
    return null
  }

  hostname = hostname.replace(/^www\./, '').replace(/\.$/, '')
  return hostnamePattern.test(hostname) ? hostname : null
}

const toTrimmedString = (value: BriefAnswerValue | undefined) => {
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number') return String(value)
  return null
}

const toStringList = (value: BriefAnswerValue | undefined) => {
  if (Array.isArray(value)) {
    const items = value.map(item => item.trim()).filter(Boolean)
    return items.length > 0 ? items : null
  }
  const single = toTrimmedString(value)
  return single ? [single] : null
}

const toBoolean = (value: BriefAnswerValue | undefined) => {
  if (typeof value === 'boolean') return value
  const normalized = toTrimmedString(value)?.toLowerCase()
  if (normalized === 'yes' || normalized === 'oui' || normalized === 'true') return true
  if (normalized === 'no' || normalized === 'non' || normalized === 'false') return false
  return null
}

const toEnum = <T extends string>(values: readonly T[]) => (value: BriefAnswerValue | undefined) => {
  const normalized = toTrimmedString(value)
  return normalized && (values as readonly string[]).includes(normalized) ? normalized as T : null
}

const toIsoDate = (value: BriefAnswerValue | undefined) => {
  const match = toTrimmedString(value)?.match(/^(\d{4}-\d{2}-\d{2})/)
  if (!match) return null
  const date = new Date(`${match[1]}T00:00:00Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== match[1] ? null : match[1]!
}

const keyFieldParsers = {
  projectType: toEnum(briefProjectTypes),
  goals: toStringList,
  budgetRange: toEnum(briefBudgetRanges),
  deadline: toIsoDate,
  deadlineContext: toTrimmedString,
  decisionMaker: toTrimmedString,
  currentWebsite: toTrimmedString,
  domainRegistrar: toTrimmedString,
  siteManager: toEnum(briefSiteManagers),
  providerInformed: toBoolean,
  accessAvailability: toEnum(briefAccessAvailabilities),
  domainEmails: toBoolean,
  emailProvider: toTrimmedString,
  toolsToConnect: toStringList
} satisfies Record<keyof typeof briefKeyAnswerIds, (value: BriefAnswerValue | undefined) => unknown>

export const getAnsweredValue = <T>(field: BriefKeyField<T> | undefined) => (
  field?.status === 'answered' ? field.value : null
)

// Extraction tolérante : une valeur hors liste (formulaire qui a évolué plus vite que le CRM) est
// simplement absente de la synthèse, jamais une erreur - la réponse brute reste dans answers.
export function extractBriefKeyFields(answers: BriefAnswer[]) {
  const answersById = new Map(answers.map(answer => [answer.id, answer]))
  const summary: Record<string, BriefKeyField<unknown>> = {}

  for (const [field, answerId] of Object.entries(briefKeyAnswerIds) as [keyof typeof briefKeyAnswerIds, string][]) {
    const answer = answersById.get(answerId)
    if (!answer) continue

    if (answer.status === 'unknown') {
      summary[field] = { status: 'unknown' }
      continue
    }

    const value = keyFieldParsers[field](answer.value)
    if (value !== null) summary[field] = { status: 'answered', value }
  }

  const typedSummary = summary as BriefSummary

  return {
    summary: typedSummary,
    projectType: getAnsweredValue(typedSummary.projectType),
    budgetRange: getAnsweredValue(typedSummary.budgetRange),
    deadline: getAnsweredValue(typedSummary.deadline),
    domain: normalizeDomain(getAnsweredValue(typedSummary.currentWebsite))
  }
}

export function formatBriefAnswerValue(value: BriefAnswerValue | undefined) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-'
  return String(value).trim() || '-'
}

const OTHER_SECTION_LABEL = 'Autres réponses'

// Conserve l'ordre d'envoi du site : c'est l'ordre du formulaire, le seul que le prospect a vu.
export function groupBriefAnswersBySection(answers: BriefAnswer[]) {
  const sections = new Map<string, BriefAnswer[]>()

  for (const answer of answers) {
    const section = answer.section?.trim() || OTHER_SECTION_LABEL
    const sectionAnswers = sections.get(section) ?? []
    sectionAnswers.push(answer)
    sections.set(section, sectionAnswers)
  }

  return [...sections].map(([title, items]) => ({ title, answers: items }))
}

export type BriefKeyFieldDisplay = { text: string, state: 'answered' | 'unknown' | 'missing' }

export function describeBriefKeyField<T>(field: BriefKeyField<T> | undefined, format: (value: T) => string = String): BriefKeyFieldDisplay {
  if (!field) return { text: 'Non renseigné', state: 'missing' }
  if (field.status === 'unknown') return { text: 'Ne sait pas', state: 'unknown' }
  return { text: format(field.value), state: 'answered' }
}
