import type { ProjectNote, ProjectNoteSummary } from '~/types'

// Clé partagée : tout composant qui appelle useProjectNotes pour le même projet lit la même liste,
// et refreshNuxtData(getProjectNotesKey(id)) suffit à mettre à jour le badge et le popover après
// une édition ou une suppression faite ailleurs (vue plein écran).
export const getProjectNotesKey = (projectId: number) => `project-notes-${projectId}`

// Partagé par la liste et la vue plein écran : chacune enchaîne ensuite sa propre mise à jour.
export function useDeleteProjectNote() {
  const { showError, showSuccess } = useFeedbackToast()

  return async (noteId: number) => {
    try {
      await $fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      showSuccess('Note supprimée', 'La note a été supprimée.')
      return true
    } catch (error) {
      showError('Suppression impossible', error, 'La note n\'a pas pu être supprimée.')
      return false
    }
  }
}

export function useProjectNotes(projectId: number) {
  const { showError } = useFeedbackToast()

  // Chargée côté client uniquement : la liste n'est pas nécessaire au premier rendu de la page, et
  // les dates relatives calculées au rendu divergeraient entre serveur et client.
  const { data, status, error, refresh } = useFetch<{ notes: ProjectNoteSummary[] }>(`/api/projects/${projectId}/notes`, {
    key: getProjectNotesKey(projectId),
    server: false,
    lazy: true,
    default: () => ({ notes: [] })
  })

  const notes = computed(() => data.value.notes)
  const isInitialLoading = computed(() => (status.value === 'idle' || status.value === 'pending') && notes.value.length === 0)
  const isCreating = ref(false)

  const createNote = async () => {
    isCreating.value = true
    try {
      const note = await $fetch<ProjectNote>(`/api/projects/${projectId}/notes`, { method: 'POST', body: {} })
      await refresh()
      return note
    } catch (createError) {
      showError('Création impossible', createError, 'La note n\'a pas pu être créée.')
      return null
    } finally {
      isCreating.value = false
    }
  }

  const deleteProjectNote = useDeleteProjectNote()

  const deleteNote = async (noteId: number) => {
    const isDeleted = await deleteProjectNote(noteId)
    if (isDeleted) await refresh()
    return isDeleted
  }

  return {
    notes,
    isInitialLoading,
    error,
    refresh,
    isCreating,
    createNote,
    deleteNote
  }
}
