import { briefKeyAnswerIds, type BriefBudgetRange, type BriefProjectType } from '../constants/briefs'
import type { BriefSummary } from '../types/brief'
import type { BriefAnswer } from '../validation/briefs'
import type { BriefAlert } from './brief-alerts'
import { getAnsweredValue, getBriefBudgetRangeLabel, getBriefProjectTypeLabel, normalizeDomain } from './briefs'
import { toProjectInputDate } from './projects'

type BriefForProject = {
  summary: BriefSummary | null
  projectType: BriefProjectType | null
  budgetRange: BriefBudgetRange | null
  deadline: string | null
  domain: string | null
}

type ProjectFieldsInput = {
  description?: string | null
  url?: string | null
  endDate?: Date | string | null
  notes?: string | null
}

// Seuls champs du projet qu'un brief peut renseigner. Le nom n'en fait pas partie pour un projet
// existant (c'est le nôtre), le statut non plus (l'avant-vente n'est posée qu'à la création).
export const briefFillableProjectFields = ['description', 'url', 'endDate', 'notes'] as const
export type BriefFillableProjectField = typeof briefFillableProjectFields[number]

export type BriefProjectFields = {
  name: string
  description: string | null
  url: string | null
  endDate: string | null
  notes: string | null
}

// Même construction que le bloc de reprise de drizzle/0047_briefs_to_projects.sql : les deux
// doivent produire le même projet pour un même brief.
export function buildProjectFieldsFromBrief(brief: BriefForProject): BriefProjectFields {
  const summary = brief.summary ?? {}
  const typeLabel = brief.projectType ? getBriefProjectTypeLabel(brief.projectType) : null

  const goals = getAnsweredValue(summary.goals)
  const deadlineContext = getAnsweredValue(summary.deadlineContext)
  const description = [
    goals?.length ? `Objectifs :${goals.map(goal => `\n- ${goal}`).join('')}` : null,
    deadlineContext ? `Contexte de l’échéance : ${deadlineContext}` : null
  ].filter(Boolean).join('\n\n')

  const decisionMaker = getAnsweredValue(summary.decisionMaker)
  const tools = getAnsweredValue(summary.toolsToConnect)
  const noteLines = [
    typeLabel ? `- Type de projet : ${typeLabel}` : null,
    brief.budgetRange ? `- Budget : ${getBriefBudgetRangeLabel(brief.budgetRange)}` : null,
    decisionMaker ? `- Décideur : ${decisionMaker}` : null,
    tools?.length ? `- Outils à connecter : ${tools.join(', ')}` : null
  ].filter(Boolean)

  return {
    name: typeLabel ?? 'Nouveau projet',
    description: description || null,
    url: brief.domain ? `https://${brief.domain}` : null,
    endDate: brief.deadline,
    notes: noteLines.length > 0 ? `Issu du brief pré-rendez-vous :\n${noteLines.join('\n')}` : null
  }
}

const isEmpty = (value: unknown) => value === null || value === undefined || (typeof value === 'string' && value.trim() === '')

// Complète un projet existant sans jamais écraser ce que nous y avons saisi : seuls les champs vides
// reçoivent une valeur, et appliedFields garde la trace de ce que le brief a rempli.
export function getEmptyProjectFieldsFromBrief(project: ProjectFieldsInput, fields: BriefProjectFields) {
  const updates: Partial<Record<BriefFillableProjectField, string>> = {}

  for (const field of briefFillableProjectFields) {
    const value = fields[field]
    if (value !== null && isEmpty(project[field])) updates[field] = value
  }

  return { updates, appliedFields: Object.keys(updates) as BriefFillableProjectField[] }
}

// Calculé à l'affichage plutôt que figé à la réception : un écart corrigé ensuite sur le projet
// disparaît de lui-même.
export function getBriefProjectDiscrepancies(
  brief: Pick<BriefForProject, 'domain' | 'deadline'>,
  project: Pick<ProjectFieldsInput, 'url' | 'endDate'> | null
): BriefAlert[] {
  if (!project) return []
  const alerts: BriefAlert[] = []

  const projectDomain = normalizeDomain(project.url)
  if (brief.domain && projectDomain && brief.domain !== projectDomain) {
    alerts.push({
      id: 'project-url-mismatch',
      level: 'error',
      title: 'Site différent de celui du projet',
      description: `Le prospect indique ${brief.domain}, le projet pointe vers ${projectDomain}.`
    })
  }

  // Les dates de projet sont saisies en jour local : on compare le jour local.
  const projectEndDay = toProjectInputDate(project.endDate) || null
  if (brief.deadline && projectEndDay && brief.deadline !== projectEndDay) {
    alerts.push({
      id: 'project-deadline-mismatch',
      level: 'warning',
      title: 'Échéance différente de la date de fin du projet',
      description: `Échéance déclarée : ${brief.deadline}. Date de fin du projet : ${projectEndDay}.`
    })
  }

  return alerts
}

// Partie technique qu'un client qui revient n'a qu'à vérifier : elle change rarement d'un projet à
// l'autre, contrairement au besoin, au budget ou à l'échéance.
export const briefReusableAnswerIds = [
  briefKeyAnswerIds.currentWebsite,
  briefKeyAnswerIds.domainRegistrar,
  briefKeyAnswerIds.siteManager,
  briefKeyAnswerIds.providerInformed,
  briefKeyAnswerIds.accessAvailability,
  briefKeyAnswerIds.domainEmails,
  briefKeyAnswerIds.emailProvider,
  briefKeyAnswerIds.toolsToConnect
] as const

export function selectReusableAnswers(answers: BriefAnswer[] | null | undefined) {
  const reusable = new Set<string>(briefReusableAnswerIds)
  return (answers ?? [])
    .filter(answer => reusable.has(answer.id))
    .map(({ id, status, value }) => (status === 'unknown' ? { id, status } : { id, status, value: value ?? null }))
}
