<script setup lang="ts">
import type { CommandPaletteGroup } from '@nuxt/ui'

type SearchResults = {
  clients: Array<{ id: number, name: string }>
  projects: Array<{ id: number, name: string, clientId: number, clientName: string }>
  contacts: Array<{ id: number, firstName: string, lastName: string, clientId: number | null, clientName: string | null }>
}

const { showError } = useFeedbackToast()
const searchTerm = ref('')
const loading = ref(false)
const results = ref<SearchResults>({ clients: [], projects: [], contacts: [] })

let searchDebounce: ReturnType<typeof setTimeout> | undefined

const runSearch = async (term: string) => {
  try {
    results.value = await $fetch<SearchResults>('/api/search', { query: { q: term } })
  } catch (error) {
    showError('Recherche impossible', error, 'Impossible de récupérer les résultats de recherche.')
    results.value = { clients: [], projects: [], contacts: [] }
  } finally {
    loading.value = false
  }
}

watch(searchTerm, (value) => {
  if (searchDebounce) clearTimeout(searchDebounce)
  const term = value.trim()

  if (term.length < 2) {
    loading.value = false
    results.value = { clients: [], projects: [], contacts: [] }
    return
  }

  loading.value = true
  searchDebounce = setTimeout(() => runSearch(term), 250)
})

onBeforeUnmount(() => {
  if (searchDebounce) clearTimeout(searchDebounce)
})

const groups = computed<CommandPaletteGroup[]>(() => [
  {
    id: 'clients',
    label: 'Clients',
    items: results.value.clients.map(client => ({
      label: client.name,
      icon: 'i-lucide-building-2',
      onSelect: () => navigateTo(`/clients/${client.id}`)
    }))
  },
  {
    id: 'projects',
    label: 'Projets',
    items: results.value.projects.map(project => ({
      label: project.name,
      suffix: project.clientName,
      icon: 'i-lucide-folder',
      onSelect: () => navigateTo(`/clients/${project.clientId}/projects/${project.id}`)
    }))
  },
  {
    id: 'contacts',
    label: 'Contacts',
    items: results.value.contacts.map(contact => ({
      label: `${contact.firstName} ${contact.lastName}`,
      suffix: contact.clientName ?? undefined,
      icon: 'i-lucide-user-round',
      onSelect: () => navigateTo(`/contacts?q=${encodeURIComponent(`${contact.firstName} ${contact.lastName}`)}`)
    }))
  }
].filter(group => group.items.length > 0))
</script>

<template>
  <UDashboardSearch
    v-model:search-term="searchTerm"
    :groups="groups"
    :loading="loading"
    :color-mode="false"
    title="Recherche"
    description="Rechercher un client, un projet ou un contact"
    placeholder="Rechercher un client, un projet, un contact..."
  />
</template>
