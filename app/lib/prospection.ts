import { lostProspectStatus, prospectionStatuses, type ProspectionStatus } from '../constants/prospection'

// Effets de bord automatiques d'un changement de statut de prospection : horodatage de la première
// entrée dans une colonne "contacté"/"relancé", et archivage dès l'entrée dans "perdu" (désarchivage
// dès qu'on en ressort) - point de passage unique pour la création et la mise à jour d'un client afin
// que le comportement soit identique quelle que soit l'origine du changement (drag & drop du kanban
// ou formulaire d'édition). `now` est injectable pour les tests, à l'image de resolveTaskLifecycleDates.
export function getProspectionStatusSideEffects(status: ProspectionStatus, now = new Date()) {
  const sideEffects: { contactedAt?: Date, relancedAt?: Date, archived: boolean } = {
    archived: status === lostProspectStatus
  }

  if (status === 'contacte') sideEffects.contactedAt = now
  if (status === 'a_relancer') sideEffects.relancedAt = now

  return sideEffects
}

const statusRank = (status: ProspectionStatus) => prospectionStatuses.indexOf(status)

// Sens inverse de getProspectionStatusSideEffects : saisir à la main une date de contact/relance
// (typiquement un backfill depuis la fiche client) fait avancer le statut jusqu'à l'étape
// correspondante, comme si le dossier avait été déplacé dans la colonne du kanban. Ne fait jamais
// reculer un statut déjà plus avancé (ex. renseigner rétroactivement contactedAt sur un dossier en
// négociation ne le repousse pas en "Contacté"), et si les deux dates sont ajoutées d'un coup, l'étape
// la plus avancée l'emporte.
export function getStatusAdvanceFromDateEntry(
  currentStatus: ProspectionStatus,
  { contactedAtAdded, relancedAtAdded }: { contactedAtAdded?: boolean, relancedAtAdded?: boolean }
): ProspectionStatus | null {
  const currentRank = statusRank(currentStatus)
  let advancedStatus: ProspectionStatus | null = null

  if (contactedAtAdded && currentRank < statusRank('contacte')) advancedStatus = 'contacte'
  if (relancedAtAdded && currentRank < statusRank('a_relancer')) advancedStatus = 'a_relancer'

  return advancedStatus
}

export function getProspectionStatusLabel(status: ProspectionStatus) {
  switch (status) {
    case 'contacte':
      return 'Contacté'
    case 'a_relancer':
      return 'Relancé'
    case 'proposition_envoye':
      return 'Proposition envoyée'
    case 'negociation':
      return 'En négociation'
    case 'client':
      return 'Client'
    case 'perdu':
      return 'Perdu'
    default:
      return 'Nouveau'
  }
}

export function getProspectionStatusIcon(status: ProspectionStatus) {
  switch (status) {
    case 'contacte':
      return 'i-lucide-phone'
    case 'a_relancer':
      return 'i-lucide-bell'
    case 'proposition_envoye':
      return 'i-lucide-file-text'
    case 'negociation':
      return 'i-lucide-handshake'
    case 'client':
      return 'i-lucide-circle-check'
    case 'perdu':
      return 'i-lucide-circle-x'
    default:
      return 'i-lucide-user-plus'
  }
}

// Palette dédiée à la prospection, distincte de celle du kanban des tâches (lib/tasks.ts) pour ne
// pas laisser deux statuts sans rapport (ex. "En négociation" et "À valider par le client") se
// confondre visuellement sous la même teinte. Seuls "Nouveau" (neutre, convention universelle "pas
// commencé") et "Client" (vert, convention universelle "gagné") partagent volontairement une teinte
// avec les tâches - le reste de la progression utilise une famille de couleurs différente.
export function getProspectionStatusClass(status: ProspectionStatus) {
  switch (status) {
    case 'contacte':
      return 'bg-teal-100 text-teal-700 ring-teal-200'
    case 'a_relancer':
      return 'bg-orange-100 text-orange-700 ring-orange-200'
    case 'proposition_envoye':
      return 'bg-indigo-100 text-indigo-700 ring-indigo-200'
    case 'negociation':
      return 'bg-pink-100 text-pink-700 ring-pink-200'
    case 'client':
      return 'bg-emerald-100 text-emerald-700 ring-emerald-200'
    case 'perdu':
      return 'bg-rose-100 text-rose-700 ring-rose-200'
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-200'
  }
}
