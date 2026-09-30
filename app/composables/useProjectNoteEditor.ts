import {
  classifyProjectNoteSaveError,
  createProjectNoteAutosave,
  type ProjectNoteSaveStatus
} from '~/lib/project-note-autosave'
import type { ProjectNote, ProjectNoteContent } from '~/types'

type LoadState = 'loading' | 'ready' | 'not-found' | 'error'

const EMPTY_DOCUMENT: ProjectNoteContent = { type: 'doc', content: [{ type: 'paragraph' }] }

export function useProjectNoteEditor(noteId: number, projectId: number) {
  const { showError, showSuccess } = useFeedbackToast()

  const loadState = ref<LoadState>('loading')
  const title = ref('')
  // Contenu injecté dans l'éditeur à l'ouverture ou au rechargement de la version serveur. Il n'est
  // pas mis à jour à chaque frappe : l'éditeur reste la source de vérité pendant la saisie, et
  // editorKey le remonte quand il faut vraiment remplacer son contenu.
  const initialContent = shallowRef<ProjectNoteContent>(EMPTY_DOCUMENT)
  const editorKey = ref(0)
  const saveStatus = ref<ProjectNoteSaveStatus>('saved')
  const hasConflict = computed(() => saveStatus.value === 'conflict')
  const isResolvingConflict = ref(false)

  let latestContent: ProjectNoteContent = EMPTY_DOCUMENT
  let autosave: ReturnType<typeof createProjectNoteAutosave> | null = null

  const applyServerNote = (note: ProjectNote) => {
    title.value = note.title ?? ''
    initialContent.value = note.content ?? EMPTY_DOCUMENT
    latestContent = initialContent.value
    editorKey.value += 1
  }

  const fetchNote = () => $fetch<ProjectNote>(`/api/notes/${noteId}`)

  const load = async () => {
    loadState.value = 'loading'
    try {
      const note = await fetchNote()
      // Un lien ?note= copié depuis un autre projet ne doit pas ouvrir la note hors de son contexte.
      if (note.projectId !== projectId) {
        loadState.value = 'not-found'
        return
      }

      applyServerNote(note)
      autosave = createProjectNoteAutosave({
        updatedAt: note.updatedAt,
        save: payload => $fetch<ProjectNote>(`/api/notes/${noteId}`, { method: 'PATCH', body: payload }),
        classifyError: classifyProjectNoteSaveError,
        onStatusChange: (status) => {
          saveStatus.value = status
        }
      })
      loadState.value = 'ready'
    } catch (error) {
      const statusCode = error && typeof error === 'object' ? Reflect.get(error, 'statusCode') : undefined
      loadState.value = statusCode === 404 ? 'not-found' : 'error'
    }
  }

  const onTitleChange = (value: string) => {
    title.value = value
    autosave?.update({ title: value })
  }

  const onContentChange = (content: ProjectNoteContent) => {
    latestContent = content
    autosave?.update({ content })
  }

  const flush = () => autosave?.flush() ?? Promise.resolve(true)

  // Relit la note plutôt que de réutiliser celle renvoyée par la 409 : elle a pu changer à nouveau
  // pendant que l'utilisateur lisait le message.
  const reloadServerVersion = async () => {
    isResolvingConflict.value = true
    try {
      const note = await fetchNote()
      autosave?.discardLocalChanges(note.updatedAt)
      applyServerNote(note)
    } catch (error) {
      showError('Rechargement impossible', error, 'La version enregistrée n\'a pas pu être rechargée.')
    } finally {
      isResolvingConflict.value = false
    }
  }

  const keepLocalVersion = async () => {
    isResolvingConflict.value = true
    try {
      const note = await fetchNote()
      await autosave?.overwriteWith(note.updatedAt, { title: title.value, content: latestContent })
    } catch (error) {
      showError('Enregistrement impossible', error, 'Votre version n\'a pas pu être enregistrée.')
    } finally {
      isResolvingConflict.value = false
    }
  }

  const deleteNote = async () => {
    try {
      await $fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      autosave?.dispose()
      showSuccess('Note supprimée', 'La note a été supprimée.')
      return true
    } catch (error) {
      showError('Suppression impossible', error, 'La note n\'a pas pu être supprimée.')
      return false
    }
  }

  const discardAndDispose = () => autosave?.dispose()

  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!autosave?.hasUnsavedChanges()) return
    event.preventDefault()
    // Encore exigé par certains navigateurs pour afficher la confirmation native.
    event.returnValue = ''
  }

  onMounted(() => {
    window.addEventListener('beforeunload', onBeforeUnload)
    void load()
  })

  // Fermeture par le bouton Retour ou navigation vers une autre page : rien n'a pu attendre la fin
  // de l'enregistrement, on le laisse donc se terminer après le démontage.
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', onBeforeUnload)
    const pendingAutosave = autosave
    void pendingAutosave?.flush().finally(() => pendingAutosave.dispose())
  })

  return {
    loadState,
    load,
    title,
    initialContent,
    editorKey,
    saveStatus,
    hasConflict,
    isResolvingConflict,
    onTitleChange,
    onContentChange,
    flush,
    reloadServerVersion,
    keepLocalVersion,
    deleteNote,
    discardAndDispose
  }
}
