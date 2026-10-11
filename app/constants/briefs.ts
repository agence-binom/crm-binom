export const briefStatuses = ['sent', 'opened', 'completed'] as const
export type BriefStatus = typeof briefStatuses[number]

// 'expired' n'est jamais stocké : il se déduit de expiresAt (getBriefDisplayStatus), ce qui le
// garde exact sans job planifié pour faire basculer les briefs à l'échéance.
export const briefDisplayStatuses = ['sent', 'opened', 'completed', 'expired'] as const
export type BriefDisplayStatus = typeof briefDisplayStatuses[number]

// 'new_project' : le projet est créé à la réception ; 'existing_project' : le brief cadre un projet
// choisi à l'envoi, dont il ne complète que les champs vides.
export const briefTargets = ['new_project', 'existing_project'] as const
export type BriefTarget = typeof briefTargets[number]

export const briefProjectTypes = ['showcase_site', 'redesign', 'ecommerce', 'feature', 'internal_tool', 'other'] as const
export type BriefProjectType = typeof briefProjectTypes[number]

export const briefBudgetRanges = ['lt_3k', '3k_6k', '6k_12k', '12k_25k', 'gt_25k', 'needs_advice'] as const
export type BriefBudgetRange = typeof briefBudgetRanges[number]

export const briefSiteManagers = ['internal', 'current_provider', 'former_provider', 'nobody'] as const
export type BriefSiteManager = typeof briefSiteManagers[number]

export const briefAccessAvailabilities = ['all', 'partial', 'to_find', 'unknown'] as const
export type BriefAccessAvailability = typeof briefAccessAvailabilities[number]

export const briefAnswerStatuses = ['answered', 'unknown'] as const
export type BriefAnswerStatus = typeof briefAnswerStatuses[number]

export const briefEnrichmentStatuses = ['pending', 'done', 'failed'] as const
export type BriefEnrichmentStatus = typeof briefEnrichmentStatuses[number]

// Identifiants des questions que le CRM exploite (synthèse, filtres, alertes). Ils font partie du
// contrat avec le site (docs/brief-api-contract.md) : en renommer un côté site fait silencieusement
// disparaître le champ de la synthèse, la réponse restant visible dans le détail complet.
export const briefKeyAnswerIds = {
  projectType: 'project_type',
  goals: 'goals',
  budgetRange: 'budget_range',
  deadline: 'deadline',
  deadlineContext: 'deadline_context',
  decisionMaker: 'decision_maker',
  currentWebsite: 'current_website',
  domainRegistrar: 'domain_registrar',
  siteManager: 'site_manager',
  providerInformed: 'provider_informed',
  accessAvailability: 'access_availability',
  domainEmails: 'domain_emails',
  emailProvider: 'email_provider',
  toolsToConnect: 'tools_to_connect'
} as const

export const defaultBriefExpiresInDays = 30
export const maxBriefExpiresInDays = 180
export const briefDeadlineAlertDays = 60
