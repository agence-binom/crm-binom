export type ProjectStatus = 'en_cours' | 'termine' | 'en_attente' | 'annule' | 'sans_statut'
type ProjectStatusInput = ProjectStatus | string | null | undefined
type ProjectDateInput = string | Date | null | undefined

const toValidDate = (value?: string | Date | null) => {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const toProjectInputDate = (value?: string | Date | null) => {
  const date = toValidDate(value)
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const getProjectDisplayStatus = (
  project: {
    status?: ProjectStatusInput
    startDate?: ProjectDateInput
    endDate?: ProjectDateInput
  },
  now = new Date()
): ProjectStatus => {
  if (project.status === 'annule') {
    return 'annule'
  }

  const startDate = toValidDate(project.startDate)
  const endDate = toValidDate(project.endDate)

  // en_cours/termine/en_attente ne sont que des dérivés des dates : sans date, il n'y a rien à
  // dériver, donc pas de fallback sur un ancien statut (sinon un projet reste bloqué "en cours"
  // après suppression de sa dernière date).
  if (!startDate && !endDate) {
    return 'sans_statut'
  }

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  if (endDate && endDate < todayStart) {
    return 'termine'
  }

  if (startDate && startDate > todayStart) {
    return 'en_attente'
  }

  return 'en_cours'
}
