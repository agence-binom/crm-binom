<script setup lang="ts">
import { filterProjectNotes } from '~/lib/project-notes'
import { formatDate, formatRelativeTime } from '~/lib/utils'
import type { ProjectNoteSummary } from '~/types'

const SEARCH_THRESHOLD = 8

const SHORTCUT_HINTS = [
  { label: 'Nouvelle note', kbds: ['N'] },
  { label: 'Liste des notes', kbds: ['shift', 'N'] }
]

const props = defineProps<{
  projectId: number
}>()

const route = useRoute()
const router = useRouter()
const { notes, isInitialLoading, error, refresh, isCreating, createNote, deleteNote } = useProjectNotes(props.projectId)

const open = ref(false)
// Gardée après la fermeture de la confirmation : son message ne doit pas se vider pendant l'animation.
const noteToDelete = ref<ProjectNoteSummary | null>(null)
const isDeleteConfirmOpen = ref(false)
const search = ref('')
const now = ref(new Date())
const contentRef = ref<HTMLElement | null>(null)

const noteCount = computed(() => notes.value.length)
const showSearch = computed(() => noteCount.value >= SEARCH_THRESHOLD)
const filteredNotes = computed(() => (showSearch.value ? filterProjectNotes(notes.value, search.value) : notes.value))
const triggerLabel = computed(() => (noteCount.value ? `Notes du projet (${noteCount.value})` : 'Notes du projet'))

watch(open, (isOpen) => {
  if (!isOpen) {
    search.value = ''
    return
  }

  now.value = new Date()
  // Une note a pu être créée ou modifiée par un collègue depuis le chargement de la page.
  void refresh()
})

// La vue plein écran se pilote par l'URL : une note ouverte reste partageable par lien, et le
// bouton Retour du navigateur la referme.
const openNote = async (noteId: number) => {
  open.value = false
  await router.push({ query: { ...route.query, note: String(noteId) } })
}

const onCreate = async () => {
  if (isCreating.value) return
  const note = await createNote()
  if (note) await openNote(note.id)
}

const requestDelete = (note: ProjectNoteSummary | undefined) => {
  if (!note) return
  noteToDelete.value = note
  isDeleteConfirmOpen.value = true
}

const confirmDelete = async () => {
  isDeleteConfirmOpen.value = false
  if (noteToDelete.value) await deleteNote(noteToDelete.value.id)
}

// defineShortcuts ignore la saisie, pas une couche ouverte dont le focus est sur un bouton : « n »
// créerait une note derrière elle. Le popover de notes est exclu pour que Maj+N puisse le refermer.
const OVERLAY_SELECTOR = ':is([role=dialog], [role=alertdialog], [role=menu], [role=listbox])[data-state=open]'

const isAnotherOverlayOpen = () => Array.from(document.querySelectorAll(OVERLAY_SELECTOR))
  .some(overlay => !contentRef.value || !overlay.contains(contentRef.value))

defineShortcuts({
  n: () => {
    if (isAnotherOverlayOpen()) return
    void onCreate()
  },
  shift_n: () => {
    if (isAnotherOverlayOpen()) return
    open.value = !open.value
  }
})

// Tab parcourt déjà tous les éléments ; les flèches ajoutent la navigation attendue dans une liste,
// depuis le bouton de création ou le champ de recherche jusqu'aux notes.
const onKeydown = (event: KeyboardEvent) => {
  const items = Array.from(contentRef.value?.querySelectorAll<HTMLElement>('[data-note-item]') ?? [])
  if (items.length === 0) return

  // Le bouton de suppression compte comme sa ligne : les flèches repartent de la note qu'il porte.
  const focusedItem = document.activeElement?.closest('li')?.querySelector<HTMLElement>('[data-note-item]')
  const index = focusedItem ? items.indexOf(focusedItem) : -1
  const isOnItem = index !== -1

  if (isOnItem && (event.key === 'Delete' || event.key === 'Backspace')) {
    event.preventDefault()
    requestDelete(filteredNotes.value[index])
    return
  }

  const targets: Record<string, number | undefined> = {
    ArrowDown: index + 1,
    ArrowUp: isOnItem ? index - 1 : undefined,
    Home: isOnItem ? 0 : undefined,
    End: isOnItem ? items.length - 1 : undefined
  }
  const target = targets[event.key]
  if (target === undefined) return

  event.preventDefault()
  items[Math.min(Math.max(target, 0), items.length - 1)]?.focus()
}
</script>

<template>
  <UPopover
    v-model:open="open"
    :content="{ align: 'end' }"
  >
    <UTooltip :ui="{ content: 'h-auto flex-col items-stretch gap-1 py-1.5' }">
      <template #content>
        <span>Notes du projet</span>
        <span
          v-for="hint in SHORTCUT_HINTS"
          :key="hint.label"
          class="hidden items-center justify-between gap-3 text-muted lg:flex"
        >
          {{ hint.label }}
          <span class="inline-flex gap-0.5">
            <UKbd
              v-for="kbd in hint.kbds"
              :key="kbd"
              :value="kbd"
              size="sm"
            />
          </span>
        </span>
      </template>

      <UButton
        size="sm"
        variant="soft"
        color="neutral"
        :aria-label="triggerLabel"
      >
        <UChip
          :text="noteCount"
          :show="noteCount > 0"
          color="neutral"
          size="3xl"
        >
          <UIcon
            name="i-lucide-notebook"
            class="size-4"
          />
        </UChip>
      </UButton>
    </UTooltip>

    <template #content>
      <div
        ref="contentRef"
        class="flex w-80 flex-col gap-2 p-2"
        @keydown="onKeydown"
      >
        <div
          v-if="isInitialLoading"
          class="space-y-3 p-2"
          aria-busy="true"
          aria-label="Chargement des notes"
        >
          <div
            v-for="row in 3"
            :key="row"
            class="space-y-1.5"
          >
            <USkeleton class="h-4 w-3/4" />
            <USkeleton class="h-3 w-1/3" />
          </div>
        </div>

        <div
          v-else-if="error && noteCount === 0"
          class="flex items-center justify-between gap-3 p-2 text-sm text-slate-600"
          role="alert"
        >
          Impossible de charger les notes.
          <UButton
            size="xs"
            variant="soft"
            color="neutral"
            icon="i-lucide-rotate-cw"
            @click="refresh()"
          >
            Réessayer
          </UButton>
        </div>

        <AppEmptyState
          v-else-if="noteCount === 0"
          variant="bare"
          icon="i-lucide-notebook-pen"
          title="Aucune note pour ce projet"
          description="Comptes rendus, accès, décisions : gardez-les à côté du projet."
          class="py-6"
        >
          <template #actions>
            <UButton
              size="sm"
              icon="i-lucide-plus"
              :loading="isCreating"
              @click="onCreate"
            >
              Créer la première note
            </UButton>
          </template>
        </AppEmptyState>

        <template v-else>
          <UButton
            size="sm"
            variant="soft"
            color="neutral"
            icon="i-lucide-plus"
            block
            :loading="isCreating"
            @click="onCreate"
          >
            Nouvelle note
          </UButton>

          <UInput
            v-if="showSearch"
            v-model="search"
            size="sm"
            icon="i-lucide-search"
            placeholder="Rechercher une note"
            aria-label="Rechercher une note"
            class="w-full"
          />

          <ul
            v-if="filteredNotes.length"
            class="max-h-80 space-y-0.5 overflow-y-auto"
            aria-label="Notes du projet"
          >
            <li
              v-for="note in filteredNotes"
              :key="note.id"
              class="group relative"
            >
              <button
                type="button"
                data-note-item
                class="flex w-full flex-col gap-0.5 rounded-lg py-2 ps-2.5 pe-10 text-left transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500"
                @click="openNote(note.id)"
              >
                <span class="truncate text-sm font-medium text-slate-900">
                  {{ note.displayTitle }}
                </span>
                <span class="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                  <time
                    :datetime="note.updatedAt"
                    :title="formatDate(note.updatedAt)"
                    class="shrink-0"
                  >
                    {{ formatRelativeTime(note.updatedAt, now) }}
                  </time>
                  <template v-if="note.authorName">
                    <span aria-hidden="true">·</span>
                    <span class="truncate">{{ note.authorName }}</span>
                  </template>
                </span>
              </button>
              <!-- Masqué hors survol uniquement avec une souris : sur écran tactile, il n'y a pas de survol pour le révéler. -->
              <UButton
                icon="i-lucide-trash-2"
                size="xs"
                color="neutral"
                variant="ghost"
                :aria-label="`Supprimer la note « ${note.displayTitle} »`"
                class="absolute end-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-error pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100"
                @click="requestDelete(note)"
              />
            </li>
          </ul>

          <p
            v-else
            class="px-2 py-6 text-center text-sm text-slate-500"
          >
            Aucune note ne correspond à « {{ search }} ».
          </p>
        </template>

        <!-- Déclarée dans le contenu du popover : Reka la traite alors comme une couche imbriquée,
             et le popover reste ouvert derrière la confirmation au lieu de se fermer. -->
        <ConfirmModal
          v-model:open="isDeleteConfirmOpen"
          title="Supprimer la note"
          :message="`« ${noteToDelete?.displayTitle} » sera définitivement supprimée. Cette action est irréversible.`"
          @confirm="confirmDelete"
          @cancel="isDeleteConfirmOpen = false"
        />
      </div>
    </template>
  </UPopover>
</template>
