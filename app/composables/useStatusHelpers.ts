export function useStatusHelpers() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_cours': return 'info'
      case 'termine': return 'success'
      case 'en_attente': return 'warning'
      case 'annule': return 'error'
      default: return 'neutral'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_cours': return 'En cours'
      case 'termine': return 'Terminé'
      case 'en_attente': return 'En attente'
      case 'annule': return 'Annulé'
      default: return status
    }
  }

  return {
    getStatusColor,
    getStatusLabel
  }
}
