import { briefDeadlineAlertDays } from '../constants/briefs'
import type { BriefEnrichment, BriefSummary } from '../types/brief'
import { getAnsweredValue } from './briefs'

export type BriefAlertLevel = 'error' | 'warning' | 'info'

export type BriefAlert = {
  id: string
  level: BriefAlertLevel
  title: string
  description: string
}

type BriefAlertInput = {
  summary: BriefSummary | null
  enrichment: BriefEnrichment | null
}

const DAY_MS = 24 * 60 * 60 * 1000

// Suffixes juridiques et de domaine : présents dans presque toutes les raisons sociales, ils
// feraient passer pour identiques deux prestataires sans rapport.
const NON_DISTINCTIVE_TOKENS = new Set(['com', 'net', 'org', 'sas', 'sarl', 'llc', 'inc', 'ltd', 'gmbh', 'srl', 'www', 'the', 'mail'])

const comparableTokens = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .split(/[^a-z0-9]+/)
  .filter(token => token.length >= 3 && !NON_DISTINCTIVE_TOKENS.has(token))

// « OVH » déclaré doit correspondre à « OVH SAS » détecté, « GoDaddy » à « GoDaddy.com, LLC » :
// on cherche un mot significatif commun plutôt qu'une égalité stricte, qui produirait surtout
// de fausses alertes sur des différences de raison sociale.
export function namesLookAlike(declared: string, detected: string) {
  const detectedCompact = detected.toLowerCase().replace(/[^a-z0-9]/g, '')
  const detectedTokens = comparableTokens(detected)
  return comparableTokens(declared).some(token => (
    detectedCompact.includes(token) || detectedTokens.some(detectedToken => token.includes(detectedToken))
  ))
}

const startOfUtcDay = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())

export function getBriefAlerts({ summary, enrichment }: BriefAlertInput, now = new Date()): BriefAlert[] {
  const alerts: BriefAlert[] = []
  const fields = summary ?? {}

  const declaredDomainEmails = getAnsweredValue(fields.domainEmails)
  const declaredEmailProvider = getAnsweredValue(fields.emailProvider)
  const detectedMx = enrichment?.mxHosts ?? []
  const detectedEmailProvider = enrichment?.emailProvider ?? null

  if (declaredDomainEmails === false && detectedMx.length > 0) {
    alerts.push({
      id: 'domain-emails-mismatch',
      level: 'error',
      title: 'Emails détectés sur le domaine',
      description: `Le prospect déclare ne pas avoir d’emails sur son domaine, mais des serveurs de messagerie sont configurés${detectedEmailProvider ? ` (${detectedEmailProvider})` : ''}. À vérifier avant toute migration DNS.`
    })
  } else if (declaredDomainEmails === true || detectedMx.length > 0) {
    const provider = declaredEmailProvider ?? detectedEmailProvider
    alerts.push({
      id: 'domain-emails',
      level: 'warning',
      title: 'Emails hébergés sur le nom de domaine',
      description: `${provider ? `Messagerie gérée chez ${provider}. ` : ''}Une migration du domaine ou des DNS doit préserver les enregistrements MX, sous peine de couper les emails.`
    })
  } else if (fields.domainEmails?.status === 'unknown') {
    alerts.push({
      id: 'domain-emails-unknown',
      level: 'info',
      title: 'Emails sur le domaine : ne sait pas',
      description: 'Le prospect ne sait pas si des emails utilisent son nom de domaine, et rien n’a été détecté automatiquement.'
    })
  }

  if (declaredEmailProvider && detectedEmailProvider && !namesLookAlike(declaredEmailProvider, detectedEmailProvider)) {
    alerts.push({
      id: 'email-provider-mismatch',
      level: 'error',
      title: 'Hébergeur email différent de celui déclaré',
      description: `Déclaré : ${declaredEmailProvider}. Détecté : ${detectedEmailProvider}.`
    })
  }

  const declaredRegistrar = getAnsweredValue(fields.domainRegistrar)
  const detectedRegistrar = enrichment?.registrar ?? null
  if (declaredRegistrar && detectedRegistrar && !namesLookAlike(declaredRegistrar, detectedRegistrar)) {
    alerts.push({
      id: 'registrar-mismatch',
      level: 'error',
      title: 'Bureau d’enregistrement différent de celui déclaré',
      description: `Déclaré : ${declaredRegistrar}. Détecté : ${detectedRegistrar}. Le prospect n’a peut-être pas la main sur son domaine.`
    })
  }

  const accessAvailability = getAnsweredValue(fields.accessAvailability)
  if (accessAvailability === 'partial' || accessAvailability === 'to_find'
    || accessAvailability === 'unknown' || fields.accessAvailability?.status === 'unknown') {
    alerts.push({
      id: 'access',
      level: 'warning',
      title: accessAvailability === 'partial' ? 'Accès partiels' : 'Accès à retrouver',
      description: 'Prévoir le temps de récupérer les accès (domaine, hébergement, administration du site) avant de chiffrer ou planifier.'
    })
  }

  const siteManager = getAnsweredValue(fields.siteManager)
  const providerInformed = getAnsweredValue(fields.providerInformed)
  if (siteManager === 'former_provider') {
    alerts.push({
      id: 'former-provider',
      level: 'warning',
      title: 'Site géré par un ancien prestataire',
      description: 'Les accès et la propriété du domaine peuvent être chez lui : à clarifier dès le rendez-vous.'
    })
  }
  if ((siteManager === 'current_provider' || siteManager === 'former_provider')
    && (providerInformed === false || fields.providerInformed?.status === 'unknown')) {
    alerts.push({
      id: 'provider-not-informed',
      level: 'warning',
      title: providerInformed === false ? 'Prestataire non informé du projet' : 'Prestataire peut-être pas informé',
      description: 'La transition doit être préparée avec le prospect pour éviter un blocage sur les accès ou un conflit.'
    })
  }

  const deadline = getAnsweredValue(fields.deadline)
  if (deadline) {
    const daysLeft = Math.round((Date.parse(`${deadline}T00:00:00Z`) - startOfUtcDay(now)) / DAY_MS)
    if (daysLeft < 0) {
      alerts.push({
        id: 'deadline-passed',
        level: 'info',
        title: 'Échéance déjà passée',
        description: 'L’échéance indiquée est antérieure à aujourd’hui : à requalifier en rendez-vous.'
      })
    } else if (daysLeft <= briefDeadlineAlertDays) {
      alerts.push({
        id: 'deadline-soon',
        level: 'warning',
        title: daysLeft === 0 ? 'Échéance aujourd’hui' : `Échéance dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
        description: 'Délai court : vérifier la faisabilité avant de s’engager.'
      })
    }
  }

  return alerts
}
