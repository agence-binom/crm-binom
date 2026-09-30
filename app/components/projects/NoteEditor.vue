<script setup lang="ts">
import type { DropdownMenuItem, EditorHandler, EditorToolbarItem } from '@nuxt/ui'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { getProjectNoteSaveStatusLabel } from '~/lib/project-note-autosave'
import type { ProjectNoteContent } from '~/types'

const props = defineProps<{
  noteId: number
  projectId: number
  projectName: string
}>()

const emit = defineEmits<{
  close: []
}>()

const EDITOR_EXTENSIONS = [TaskList, TaskItem.configure({ nested: true })]

// V1 volontairement restreinte : ce qui sert à prendre des notes vite, rien de plus.
const STARTER_KIT_OPTIONS = {
  heading: { levels: [2, 3] as (2 | 3)[] },
  blockquote: false as const,
  codeBlock: false as const,
  strike: false as const,
  underline: false as const
}

// Remplace le gestionnaire de lien par défaut de Nuxt UI, dont l'invite est en anglais.
const linkHandler: EditorHandler = {
  canExecute: editor => editor.can().setLink({ href: '' }) || editor.can().unsetLink(),
  execute: (editor) => {
    if (editor.isActive('link')) return editor.chain().focus().unsetLink()

    const href = window.prompt('Adresse du lien :')?.trim()
    if (!href) return editor.chain().focus()

    const absoluteHref = /^[a-z][a-z\d+.-]*:/i.test(href) ? href : `https://${href}`
    return editor.chain().focus().extendMarkRange('link').setLink({ href: absoluteHref })
  },
  isActive: editor => editor.isActive('link'),
  isDisabled: editor => editor.state.selection.empty && !editor.isActive('link')
}

const EDITOR_HANDLERS = { link: linkHandler }

const TOOLBAR_ITEMS: EditorToolbarItem[][] = [
  [
    { 'kind': 'heading', 'level': 2, 'icon': 'i-lucide-heading-2', 'aria-label': 'Titre de section', 'tooltip': { text: 'Titre de section' } },
    { 'kind': 'heading', 'level': 3, 'icon': 'i-lucide-heading-3', 'aria-label': 'Sous-titre', 'tooltip': { text: 'Sous-titre' } }
  ],
  [
    { 'kind': 'mark', 'mark': 'bold', 'icon': 'i-lucide-bold', 'aria-label': 'Gras', 'tooltip': { text: 'Gras', kbds: ['meta', 'B'] } },
    { 'kind': 'mark', 'mark': 'italic', 'icon': 'i-lucide-italic', 'aria-label': 'Italique', 'tooltip': { text: 'Italique', kbds: ['meta', 'I'] } },
    { 'kind': 'link', 'icon': 'i-lucide-link', 'aria-label': 'Lien', 'tooltip': { text: 'Lien' } }
  ],
  [
    { 'kind': 'bulletList', 'icon': 'i-lucide-list', 'aria-label': 'Liste à puces', 'tooltip': { text: 'Liste à puces' } },
    { 'kind': 'orderedList', 'icon': 'i-lucide-list-ordered', 'aria-label': 'Liste numérotée', 'tooltip': { text: 'Liste numérotée' } },
    { 'kind': 'taskList', 'icon': 'i-lucide-list-checks', 'aria-label': 'Liste de tâches', 'tooltip': { text: 'Liste de tâches' } }
  ]
]

// Le thème de UEditor ne prévoit rien pour les listes de tâches : sans ces règles elles héritent
// des puces des listes classiques.
const EDITOR_UI = {
  base: [
    'sm:px-0 *:my-3',
    '[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:ps-0.5',
    '[&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-2',
    '[&_li[data-type=taskItem]>label]:mt-[0.3em] [&_li[data-type=taskItem]>div]:flex-1',
    '[&_li[data-checked=true]>div]:text-muted [&_li[data-checked=true]>div]:line-through'
  ].join(' ')
}

const {
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
} = useProjectNoteEditor(props.noteId, props.projectId)

const editorRef = useTemplateRef<{ editor: { commands: { focus: (position: 'start' | 'end') => void } } | undefined }>('editorRef')
const isClosing = ref(false)
const isUnsavedCloseConfirmOpen = ref(false)
const isDeleteConfirmOpen = ref(false)

const saveStatusLabel = computed(() => getProjectNoteSaveStatusLabel(saveStatus.value))
const saveStatusIcon = computed(() => {
  if (saveStatus.value === 'saved') return 'i-lucide-check'
  if (saveStatus.value === 'pending' || saveStatus.value === 'saving') return 'i-lucide-loader-circle'
  return 'i-lucide-circle-alert'
})
const isSaveInError = computed(() => ['retrying', 'failed', 'conflict'].includes(saveStatus.value))

const actionItems: DropdownMenuItem[][] = [[
  { label: 'Supprimer la note', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => { isDeleteConfirmOpen.value = true } }
]]

// Tout est enregistré au fil de l'eau : on ne demande confirmation que si la dernière sauvegarde
// a échoué, c'est-à-dire quand fermer ferait réellement perdre du texte.
const requestClose = async () => {
  if (isClosing.value) return
  isClosing.value = true
  try {
    if (await flush()) emit('close')
    else isUnsavedCloseConfirmOpen.value = true
  } finally {
    isClosing.value = false
  }
}

// Pas de @close:prevent : non « dismissible », UModal l'émet aussi quand le focus sort de la
// modale, par exemple quand le popover de notes rend le focus à son bouton juste après avoir
// ouvert la note - qui se refermait aussitôt. Seul Échap doit fermer.
const modalContentProps = {
  onOpenAutoFocus: (event: Event) => event.preventDefault(),
  onEscapeKeyDown: () => void requestClose()
}

const closeWithoutSaving = () => {
  isUnsavedCloseConfirmOpen.value = false
  discardAndDispose()
  emit('close')
}

const confirmDelete = async () => {
  isDeleteConfirmOpen.value = false
  if (await deleteNote()) emit('close')
}

const focusEditorStart = () => {
  editorRef.value?.editor?.commands.focus('start')
}

const onEditorUpdate = (content: unknown) => {
  onContentChange(content as ProjectNoteContent)
}
</script>

<template>
  <UModal
    :open="true"
    fullscreen
    :dismissible="false"
    :title="title || 'Note sans titre'"
    :description="`Note du projet ${projectName}`"
    :content="modalContentProps"
  >
    <template #content>
      <div class="flex h-full flex-col bg-white">
        <header class="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 sm:px-6">
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <UIcon
              name="i-lucide-notebook"
              class="size-4 shrink-0 text-slate-400"
            />
            <span class="max-w-48 shrink-0 truncate text-sm text-slate-500">{{ projectName }}</span>
            <span
              class="text-slate-300"
              aria-hidden="true"
            >/</span>
            <UInput
              :model-value="title"
              variant="none"
              placeholder="Sans titre"
              aria-label="Titre de la note"
              maxlength="255"
              :disabled="loadState !== 'ready'"
              class="min-w-0 flex-1"
              :ui="{ base: 'px-0 text-sm font-medium text-slate-900 placeholder:text-slate-400' }"
              @update:model-value="onTitleChange(String($event))"
              @blur="flush()"
              @keydown.enter.prevent="focusEditorStart"
            />
          </div>

          <div
            v-if="loadState === 'ready'"
            class="flex shrink-0 items-center gap-1.5 text-xs"
            :class="isSaveInError ? 'text-error' : 'text-slate-400'"
            role="status"
            aria-live="polite"
          >
            <UIcon
              :name="saveStatusIcon"
              class="size-3.5"
              :class="{ 'animate-spin': saveStatus === 'saving' }"
            />
            <span>{{ saveStatusLabel }}</span>
            <UButton
              v-if="saveStatus === 'failed'"
              size="xs"
              variant="link"
              color="error"
              class="p-0"
              @click="flush()"
            >
              Réessayer
            </UButton>
          </div>

          <UDropdownMenu
            v-if="loadState === 'ready'"
            :items="actionItems"
            :content="{ align: 'end' }"
          >
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-lucide-ellipsis"
              aria-label="Actions de la note"
            />
          </UDropdownMenu>

          <UTooltip
            text="Fermer"
            :kbds="['Escape']"
          >
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-lucide-x"
              aria-label="Fermer la note"
              :loading="isClosing"
              @click="requestClose"
            />
          </UTooltip>
        </header>

        <UAlert
          v-if="hasConflict"
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="Cette note a été modifiée ailleurs entre-temps"
          description="Vos dernières modifications ne sont pas enregistrées. Rechargez la version enregistrée ou remplacez-la par la vôtre."
          class="rounded-none border-x-0 border-t-0"
          :actions="[
            { label: 'Charger la version enregistrée', color: 'warning', variant: 'solid', loading: isResolvingConflict, onClick: reloadServerVersion },
            { label: 'Garder ma version', color: 'warning', variant: 'outline', disabled: isResolvingConflict, onClick: keepLocalVersion }
          ]"
        />

        <div class="flex-1 overflow-y-auto">
          <div class="mx-auto w-full max-w-180 px-4 py-10 sm:px-6">
            <div
              v-if="loadState === 'loading'"
              class="space-y-4"
              aria-busy="true"
              aria-label="Chargement de la note"
            >
              <USkeleton class="h-5 w-2/3" />
              <USkeleton class="h-4 w-full" />
              <USkeleton class="h-4 w-5/6" />
            </div>

            <AppEmptyState
              v-else-if="loadState === 'not-found'"
              icon="i-lucide-notebook"
              title="Note introuvable"
              description="Elle a peut-être été supprimée, ou appartient à un autre projet."
            >
              <template #actions>
                <UButton
                  variant="soft"
                  color="neutral"
                  @click="emit('close')"
                >
                  Fermer
                </UButton>
              </template>
            </AppEmptyState>

            <UAlert
              v-else-if="loadState === 'error'"
              icon="i-lucide-circle-alert"
              color="error"
              variant="soft"
              title="Impossible de charger la note"
              :actions="[{ label: 'Réessayer', color: 'error', variant: 'soft', icon: 'i-lucide-rotate-cw', onClick: load }]"
            />

            <UEditor
              v-else
              :key="editorKey"
              ref="editorRef"
              v-slot="{ editor }"
              :model-value="initialContent"
              content-type="json"
              :starter-kit="STARTER_KIT_OPTIONS"
              :image="false"
              :mention="false"
              :extensions="EDITOR_EXTENSIONS"
              :handlers="EDITOR_HANDLERS"
              placeholder="Écrivez ici… « ## » pour un titre, « - » pour une liste, « [ ] » pour une case à cocher."
              autofocus="end"
              role="textbox"
              aria-multiline="true"
              aria-label="Contenu de la note"
              :ui="EDITOR_UI"
              class="min-h-[50vh]"
              @update:model-value="onEditorUpdate"
              @blur="flush()"
            >
              <UEditorToolbar
                :editor="editor"
                :items="TOOLBAR_ITEMS"
                layout="bubble"
              />
            </UEditor>
          </div>
        </div>
      </div>

      <ConfirmModal
        :open="isDeleteConfirmOpen"
        title="Supprimer la note"
        message="Cette note sera définitivement supprimée. Cette action est irréversible."
        @confirm="confirmDelete"
        @cancel="isDeleteConfirmOpen = false"
      />

      <ConfirmModal
        :open="isUnsavedCloseConfirmOpen"
        title="Modifications non enregistrées"
        message="La dernière sauvegarde a échoué : si vous fermez maintenant, vos dernières modifications seront perdues."
        @confirm="closeWithoutSaving"
        @cancel="isUnsavedCloseConfirmOpen = false"
      />
    </template>
  </UModal>
</template>
