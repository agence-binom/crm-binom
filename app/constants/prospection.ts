export const prospectionStatuses = [
  'nouveau',
  'contacte',
  'a_relancer',
  'proposition_envoye',
  'negociation',
  'client',
  'perdu'
] as const

export type ProspectionStatus = typeof prospectionStatuses[number]

// Seul statut qui fait sortir un dossier de la prospection pour basculer côté /clients - centralisé
// ici pour ne pas comparer la chaîne 'client' en dur à plusieurs endroits (pages, server/utils, requêtes SQL).
export const finalClientStatus: ProspectionStatus = 'client'

export const isClientStatus = (status?: string | null) => status === finalClientStatus
export const isProspectStatus = (status?: string | null) => !isClientStatus(status)

// Colonnes du tableau kanban Prospection : 'client' quitte le tableau dès qu'il est atteint
// (bascule automatique côté /clients), il n'a donc pas de colonne dédiée.
export const prospectionBoardStatuses = prospectionStatuses.filter(status => !isClientStatus(status))
