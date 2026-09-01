import type { DocumentStatus } from '~/lib/documents'

const applyImportant = (classes: string) => classes.split(' ').map(token => `!${token}`).join(' ')

export function useDocumentStatusHelpers() {
  const getDocumentStatusIndicatorClass = (status: DocumentStatus, { important = false } = {}) => {
    const classes = (() => {
      switch (status) {
        case 'sent': return 'bg-warning-100 text-warning-700'
        case 'completed': return 'bg-success-500 text-white'
        case 'cancelled': return 'bg-error-500 text-white'
        case 'refused': return 'bg-error-100 text-error-700'
        case 'non_applicable': return 'bg-slate-100 text-slate-400'
        default: return 'bg-slate-200 text-slate-600'
      }
    })()

    return important ? applyImportant(classes) : classes
  }

  const getDocumentStatusSeparatorClass = (status: DocumentStatus, { important = false } = {}) => {
    const classes = (() => {
      switch (status) {
        case 'sent': return 'bg-warning-300'
        case 'completed': return 'bg-success-400'
        case 'cancelled': return 'bg-error-300'
        case 'refused': return 'bg-error-200'
        case 'non_applicable': return 'bg-slate-200'
        default: return 'bg-slate-300'
      }
    })()

    return important ? applyImportant(classes) : classes
  }

  return {
    getDocumentStatusIndicatorClass,
    getDocumentStatusSeparatorClass
  }
}
