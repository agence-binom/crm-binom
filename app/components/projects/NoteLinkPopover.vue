<script setup lang="ts">
import type { EditorHandler } from '@nuxt/ui'

// Type dérivé de Nuxt UI plutôt qu'importé de @tiptap/vue-3, qui n'est qu'une dépendance transitive.
type TiptapEditor = Parameters<EditorHandler['execute']>[0]

const props = defineProps<{
  editor: TiptapEditor
}>()

const open = ref(false)
const url = ref('')
// Lien cliqué dans le texte : le popover s'y ancre au lieu du bouton de la barre, qui disparaît
// dès que l'éditeur perd le focus au profit du champ.
const clickedLink = shallowRef<HTMLAnchorElement>()

const isActive = ref(false)
const isDisabled = ref(true)

// Un computed ne suit pas la sélection de façon fiable : la réactivité de editor.state est un
// détail interne de @tiptap/vue-3, déclenché avec deux frames de retard. On relit donc l'état
// à chaque transaction, sélection comprise.
const syncLinkState = () => {
  isActive.value = props.editor.isActive('link')
  isDisabled.value = props.editor.state.selection.empty && !isActive.value
}

watch(() => props.editor, (editor, _previous, onCleanup) => {
  syncLinkState()
  editor.on('transaction', syncLinkState)
  onCleanup(() => editor.off('transaction', syncLinkState))
}, { immediate: true })

watch(open, (isOpen) => {
  if (isOpen) url.value = clickedLink.value?.getAttribute('href') ?? props.editor.getAttributes('link').href ?? ''
  else clickedLink.value = undefined
})

const onEditorClick = (event: MouseEvent) => {
  const link = (event.target as HTMLElement | null)?.closest('a[href]')
  // Une sélection non vide, c'est un glisser sur le texte du lien : on laisse la barre s'afficher.
  if (!(link instanceof HTMLAnchorElement) || !window.getSelection()?.isCollapsed) return
  clickedLink.value = link
  open.value = true
}

// La vue de l'éditeur peut ne pas être encore montée au setup de ce composant : y accéder lèverait
// une erreur Tiptap.
let editorDom: HTMLElement | undefined
const listenToLinkClicks = () => {
  editorDom = props.editor.view.dom
  editorDom.addEventListener('click', onEditorClick)
}

onMounted(() => {
  if (props.editor.isInitialized) listenToLinkClicks()
  else props.editor.on('create', listenToLinkClicks)
})

onBeforeUnmount(() => {
  props.editor.off('create', listenToLinkClicks)
  editorDom?.removeEventListener('click', onEditorClick)
})

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

// window.open ne passe pas par la validation de protocole de Tiptap : sans ce filtre, un
// « javascript:… » saisi dans le champ serait exécuté au clic sur « Ouvrir ».
const toSafeHref = (input: string) => {
  const href = /^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`
  try {
    return ALLOWED_PROTOCOLS.includes(new URL(href).protocol) ? href : null
  } catch {
    return null
  }
}

const safeHref = computed(() => toSafeHref(url.value.trim()))

const applyLink = () => {
  if (!url.value.trim()) {
    removeLink()
    return
  }
  if (!safeHref.value) return
  props.editor.chain().focus().extendMarkRange('link').setLink({ href: safeHref.value }).run()
  open.value = false
}

const removeLink = () => {
  props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
  open.value = false
}

const openLink = () => {
  if (safeHref.value) window.open(safeHref.value, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <UPopover
    v-model:open="open"
    :reference="clickedLink"
    :ui="{ content: 'p-0.5' }"
  >
    <UTooltip text="Lien">
      <UButton
        icon="i-lucide-link"
        color="neutral"
        active-color="primary"
        variant="ghost"
        active-variant="soft"
        size="sm"
        aria-label="Lien"
        :active="isActive"
        :disabled="isDisabled"
      />
    </UTooltip>

    <template #content>
      <UInput
        v-model="url"
        autofocus
        name="url"
        type="url"
        variant="none"
        placeholder="Coller un lien…"
        aria-label="Adresse du lien"
        class="w-72"
        @keydown.enter.prevent="applyLink"
      >
        <template #trailing>
          <div class="flex items-center gap-0.5">
            <UButton
              icon="i-lucide-corner-down-left"
              variant="ghost"
              size="sm"
              aria-label="Appliquer le lien"
              :disabled="url.trim() ? !safeHref : !isActive"
              @click="applyLink"
            />
            <USeparator
              orientation="vertical"
              class="h-6 mx-1"
            />
            <UButton
              icon="i-lucide-external-link"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Ouvrir dans un nouvel onglet"
              :disabled="!safeHref"
              @click="openLink"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Retirer le lien"
              :disabled="!isActive"
              @click="removeLink"
            />
          </div>
        </template>
      </UInput>
    </template>
  </UPopover>
</template>
