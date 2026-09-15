import type { ProspectionStatus } from '../constants/prospection'

export function getProspectionStatusLabel(status: ProspectionStatus) {
  switch (status) {
    case 'contacte':
      return 'Contacté'
    case 'a_relancer':
      return 'À relancer'
    case 'devis_envoye':
      return 'Devis envoyé'
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
    case 'devis_envoye':
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
    case 'devis_envoye':
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
