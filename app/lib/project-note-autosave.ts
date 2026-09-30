import type { ProjectNoteContent } from '~/types'

export type ProjectNoteChanges = {
  title?: string | null
  content?: ProjectNoteContent | null
}

export type ProjectNoteSaveStatus = 'saved' | 'pending' | 'saving' | 'retrying' | 'failed' | 'conflict'

export type ProjectNoteSaveErrorKind = 'conflict' | 'retry' | 'fail'

type AutosaveOptions = {
  updatedAt: string
  save: (payload: ProjectNoteChanges & { updatedAt: string }) => Promise<{ updatedAt: string }>
  classifyError: (error: unknown) => ProjectNoteSaveErrorKind
  onStatusChange: (status: ProjectNoteSaveStatus) => void
  onConflict?: (error: unknown) => void
  debounceMs?: number
  retryDelaysMs?: number[]
}

const DEFAULT_DEBOUNCE_MS = 800
const DEFAULT_RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 30_000]
// Erreurs 4xx qui signalent un état passager plutôt qu'une requête invalide.
const RETRYABLE_CLIENT_STATUS_CODES = new Set([408, 429])

const getStatusCode = (error: unknown) => {
  if (!error || typeof error !== 'object') return undefined
  const statusCode = Reflect.get(error, 'statusCode')
  return typeof statusCode === 'number' ? statusCode : undefined
}

// Sans code HTTP (réseau coupé, serveur injoignable) ou en 5xx, un nouvel essai a des chances
// d'aboutir ; une 4xx (contenu trop lourd, note supprimée...) échouerait à l'identique.
export const classifyProjectNoteSaveError = (error: unknown): ProjectNoteSaveErrorKind => {
  const statusCode = getStatusCode(error)
  if (statusCode === 409) return 'conflict'
  if (statusCode && statusCode >= 400 && statusCode < 500 && !RETRYABLE_CLIENT_STATUS_CODES.has(statusCode)) return 'fail'
  return 'retry'
}

export const getProjectNoteSaveStatusLabel = (status: ProjectNoteSaveStatus) => {
  switch (status) {
    case 'saved':
      return 'Enregistré'
    case 'pending':
    case 'saving':
      return 'Enregistrement…'
    case 'retrying':
      return 'Erreur, nouvel essai…'
    case 'failed':
      return 'Échec de l\'enregistrement'
    case 'conflict':
      return 'Non enregistré'
  }
}

// File d'enregistrement d'une note, sans dépendance à Vue pour pouvoir être testée seule.
//
// Invariant : une modification n'est jamais oubliée. Elle reste dans `pending` jusqu'à ce qu'un
// PATCH qui la contient réussisse ; un PATCH en échec la remet en file, sous les modifications
// faites entre-temps (plus récentes, donc prioritaires). Un seul PATCH part à la fois, sinon le
// second partirait avec un updatedAt déjà périmé et déclencherait un faux conflit.
export const createProjectNoteAutosave = (options: AutosaveOptions) => {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS
  const retryDelaysMs = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS

  let knownUpdatedAt = options.updatedAt
  let pending: ProjectNoteChanges = {}
  let inFlight: Promise<void> | null = null
  let status: ProjectNoteSaveStatus = 'saved'
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let retryAttempt = 0
  let disposed = false

  const setStatus = (next: ProjectNoteSaveStatus) => {
    if (next === status) return
    status = next
    options.onStatusChange(next)
  }

  const hasPendingChanges = () => Object.keys(pending).length > 0
  // Fonction plutôt que comparaison en ligne : `status` change pendant un `await`, et TypeScript
  // conserverait sinon le rétrécissement de type obtenu avant l'attente.
  const isInError = () => status === 'retrying' || status === 'failed' || status === 'conflict'

  const scheduleRetry = () => {
    const delay = retryDelaysMs[Math.min(retryAttempt, retryDelaysMs.length - 1)]
    retryAttempt += 1
    clearTimeout(retryTimer)
    retryTimer = setTimeout(() => void flush(), delay)
  }

  const send = async () => {
    const changes = pending
    pending = {}
    setStatus('saving')

    try {
      const saved = await options.save({ ...changes, updatedAt: knownUpdatedAt })
      knownUpdatedAt = saved.updatedAt
      retryAttempt = 0
      setStatus(hasPendingChanges() ? 'pending' : 'saved')
    } catch (error) {
      pending = { ...changes, ...pending }

      const kind = options.classifyError(error)
      if (kind === 'conflict') {
        setStatus('conflict')
        options.onConflict?.(error)
      } else if (kind === 'fail') {
        setStatus('failed')
      } else {
        setStatus('retrying')
        if (!disposed) scheduleRetry()
      }
    }
  }

  // Renvoie true si tout est enregistré à la sortie. Un appel explicite (fermeture, blur) retente
  // immédiatement une sauvegarde en échec au lieu d'attendre le prochain essai programmé.
  const flush = async (): Promise<boolean> => {
    clearTimeout(debounceTimer)

    while (true) {
      if (inFlight) {
        await inFlight
        continue
      }
      if (!hasPendingChanges()) return true
      if (status === 'conflict') return false

      clearTimeout(retryTimer)
      inFlight = send().finally(() => {
        inFlight = null
      })
      await inFlight

      if (isInError()) return false
    }
  }

  const update = (changes: ProjectNoteChanges) => {
    pending = { ...pending, ...changes }
    // En conflit, on continue d'accumuler la saisie mais on n'envoie rien tant que l'utilisateur
    // n'a pas choisi entre sa version et celle du serveur. Pendant une panne, c'est l'essai
    // programmé qui emportera la saisie : relancer à chaque pause de frappe contournerait l'attente.
    if (status === 'conflict' || status === 'retrying') return
    if (status === 'saved' || status === 'saving') setStatus('pending')

    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => void flush(), debounceMs)
  }

  const discardLocalChanges = (serverUpdatedAt: string) => {
    clearTimeout(debounceTimer)
    clearTimeout(retryTimer)
    pending = {}
    knownUpdatedAt = serverUpdatedAt
    retryAttempt = 0
    setStatus('saved')
  }

  // Écrase la version serveur avec l'état complet de l'éditeur, pas seulement les champs modifiés :
  // sinon on obtiendrait un mélange des deux versions.
  const overwriteWith = (serverUpdatedAt: string, fullDraft: Required<ProjectNoteChanges>) => {
    knownUpdatedAt = serverUpdatedAt
    pending = { ...fullDraft }
    retryAttempt = 0
    setStatus('pending')
    return flush()
  }

  const dispose = () => {
    disposed = true
    clearTimeout(debounceTimer)
    clearTimeout(retryTimer)
  }

  return {
    update,
    flush,
    discardLocalChanges,
    overwriteWith,
    dispose,
    hasUnsavedChanges: () => hasPendingChanges() || inFlight !== null,
    getStatus: () => status
  }
}
