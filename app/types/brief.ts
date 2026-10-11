import type {
  BriefAccessAvailability,
  BriefBudgetRange,
  BriefDisplayStatus,
  BriefEnrichmentStatus,
  BriefProjectType,
  BriefSiteManager,
  BriefStatus,
  BriefTarget
} from '../constants/briefs'
import type { BriefAnswer } from '../validation/briefs'

// Clé absente = question non répondue ; { status: 'unknown' } = « Je ne sais pas ». Les deux cas
// déclenchent des alertes différentes, ils ne doivent jamais être confondus.
export type BriefKeyField<T> = { status: 'answered', value: T } | { status: 'unknown' }

export type BriefSummary = {
  projectType?: BriefKeyField<BriefProjectType>
  goals?: BriefKeyField<string[]>
  budgetRange?: BriefKeyField<BriefBudgetRange>
  deadline?: BriefKeyField<string>
  deadlineContext?: BriefKeyField<string>
  decisionMaker?: BriefKeyField<string>
  currentWebsite?: BriefKeyField<string>
  domainRegistrar?: BriefKeyField<string>
  siteManager?: BriefKeyField<BriefSiteManager>
  providerInformed?: BriefKeyField<boolean>
  accessAvailability?: BriefKeyField<BriefAccessAvailability>
  domainEmails?: BriefKeyField<boolean>
  emailProvider?: BriefKeyField<string>
  toolsToConnect?: BriefKeyField<string[]>
}

export type BriefEnrichment = {
  domain: string
  registrar?: string | null
  nameServers?: string[]
  mxHosts?: string[]
  emailProvider?: string | null
  ipAddresses?: string[]
  reverseDns?: string[]
  hosting?: string | null
  technologies?: string[]
  finalUrl?: string | null
  // Une sonde en échec n'invalide pas les autres : on garde la raison pour l'afficher.
  errors?: Record<string, string>
}

export type BriefListItem = {
  id: number
  clientId: number
  projectId: number | null
  projectName: string | null
  target: BriefTarget
  contactId: number | null
  contactName: string | null
  status: BriefStatus
  displayStatus: BriefDisplayStatus
  url: string
  expiresAt: string
  openedAt: string | null
  completedAt: string | null
  createdAt: string
  projectType: BriefProjectType | null
  budgetRange: BriefBudgetRange | null
}

export type Brief = BriefListItem & {
  formVersion: string | null
  deadline: string | null
  domain: string | null
  summary: BriefSummary | null
  answers: BriefAnswer[] | null
  enrichment: BriefEnrichment | null
  enrichmentStatus: BriefEnrichmentStatus | null
  enrichedAt: string | null
  appliedFields: string[] | null
}

// Résumé affiché sur la carte d'un projet de la fiche client.
export type ProjectBriefSummary = {
  id: number
  status: BriefDisplayStatus
}
