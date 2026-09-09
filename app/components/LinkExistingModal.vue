<script setup lang="ts">
type LinkableEntityType = 'clients' | 'contacts'

type SearchResults = {
  clients: Array<{ id: number, name: string }>
  contacts: Array<{ id: number, firstName: string, lastName: string, clientId: number | null, clientName: string | null }>
}

type Option = {
  label: string
  value: number
  clientName?: string | null
}

const props = withDefaults(defineProps<{
  open: boolean
  entityType: LinkableEntityType
  title: string
  description?: string
}>(), {
  description: 'Rechercher et sélectionner un élément déjà présent en base.'
})

export type LinkExistingSelection = {
  id: number
  label: string
  clientName?: string | null
}

const emit = defineEmits<{
  'update:open': [open: boolean]
  'select': [selection: LinkExistingSelection]
}>()

const { showError } = useFeedbackToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const searchTerm = ref('')
const loading = ref(false)
const options = ref<Option[]>([])
const selected = ref<Option>()
let searchDebounce: ReturnType<typeof setTimeout> | undefined

const runSearch = async (term: string) => {
  try {
    const results = await $fetch<SearchResults>('/api/search', { query: { q: term } })
    options.value = props.entityType === 'clients'
      ? results.clients.map(client => ({ label: client.name, value: client.id }))
      : results.contacts.map(contact => ({
          label: `${contact.firstName} ${contact.lastName}`,
          value: contact.id,
          clientName: contact.clientName
        }))
  } catch (error) {
    showError('Recherche impossible', error, 'Impossible de récupérer les résultats de recherche.')
    options.value = []
  } finally {
    loading.value = false
  }
}

watch(searchTerm, (value) => {
  if (searchDebounce) clearTimeout(searchDebounce)
  const term = value.trim()

  if (term.length < 2) {
    loading.value = false
    options.value = []
    return
  }

  loading.value = true
  searchDebounce = setTimeout(() => runSearch(term), 250)
})

watch(
  () => props.open,
  (open) => {
    if (open) return
    searchTerm.value = ''
    options.value = []
    selected.value = undefined
  }
)

onBeforeUnmount(() => {
  if (searchDebounce) clearTimeout(searchDebounce)
})

const confirm = () => {
  if (!selected.value) return
  emit('select', {
    id: selected.value.value,
    label: selected.value.label,
    clientName: selected.value.clientName
  })
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :aria-describedby="description"
    class="w-full max-w-lg rounded-2xl"
  >
    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-slate-500">
          {{ description }}
        </p>

        <USelectMenu
          v-model="selected"
          v-model:search-term="searchTerm"
          :items="options"
          :loading="loading"
          ignore-filter
          placeholder="Rechercher..."
          class="w-full"
        >
          <template #item-label="{ item }">
            <div class="flex flex-col">
              <span>{{ item.label }}</span>
              <span
                v-if="item.clientName"
                class="text-xs text-slate-400"
              >
                Actuellement lié à {{ item.clientName }}
              </span>
            </div>
          </template>
        </USelectMenu>

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <UButton
            variant="soft"
            color="neutral"
            @click="isOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            :disabled="!selected"
            @click="confirm"
          >
            Lier
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
