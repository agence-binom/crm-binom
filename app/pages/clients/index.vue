<script setup lang="ts">
import type { Client } from '~/types'

const showArchived = ref(false)

const { data, refresh } = await useFetch('/api/clients/dashboard', {
  query: { archived: showArchived }
})
const clients = computed(() => data.value?.clients || [])

const toggleArchived = () => {
  showArchived.value = !showArchived.value
}

const isClientModalOpen = ref(false)
const selectedClientId = ref<number | null>(null)

const selectedClient = computed<Client | null>(() => {
  if (!selectedClientId.value) return null
  return clients.value.find((c: Client) => c.id === selectedClientId.value) ?? null
})

const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()
const { setArchived } = useArchiveAction()

const openCreateClient = () => {
  selectedClientId.value = null
  isClientModalOpen.value = true
}

const openEditClient = (clientId: number) => {
  selectedClientId.value = clientId
  isClientModalOpen.value = true
}

const onDeleteClient = async (clientId: number) => {
  await deleteResource('client', clientId, '/api/clients', refresh)
}

const onArchiveClient = async (clientId: number) => {
  await setArchived('client', clientId, '/api/clients', true, refresh)
}

const onRestoreClient = async (clientId: number) => {
  await setArchived('client', clientId, '/api/clients', false, refresh)
}

const handleClientChange = async () => {
  await refresh()
}
</script>

<template>
  <div class="container mx-auto space-y-6 p-6">
    <AppListHeader
      title="Clients"
      level="h1"
      :count="clients.length"
    >
      <template #actions>
        <UButton
          :icon="showArchived ? 'i-lucide-users' : 'i-lucide-archive'"
          variant="ghost"
          color="neutral"
          @click="toggleArchived"
        >
          {{ showArchived ? 'Voir les clients actifs' : 'Voir les clients archivés' }}
        </UButton>
        <UButton
          icon="i-lucide-circle-plus"
          variant="soft"
          color="neutral"
          @click="openCreateClient"
        >
          Nouveau client
        </UButton>
      </template>
    </AppListHeader>

    <ClientsModal
      v-model:open="isClientModalOpen"
      :client-id="selectedClientId"
      :client="selectedClient"
      @saved="handleClientChange"
    />

    <div
      v-if="!data"
      class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 px-6 py-12 text-center text-slate-500"
    >
      Chargement...
    </div>

    <AppEmptyState
      v-else-if="clients.length === 0"
      icon="i-lucide-building-2"
      :title="showArchived ? 'Aucun client archivé' : 'Aucun client actif'"
    >
      <template
        v-if="!showArchived"
        #actions
      >
        <UButton
          icon="i-lucide-circle-plus"
          variant="soft"
          color="neutral"
          @click="openCreateClient"
        >
          Créer un client
        </UButton>
      </template>
    </AppEmptyState>

    <ul
      v-else
      class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <li
        v-for="client in clients"
        :key="client.id"
      >
        <NuxtLink
          :to="`/clients/${client.id}`"
          class="group block h-full"
        >
          <ClientsCard
            :client="client"
            @edit="openEditClient"
            @delete="onDeleteClient"
            @archive="onArchiveClient"
            @restore="onRestoreClient"
          />
        </NuxtLink>
      </li>
    </ul>

    <ConfirmModal
      :open="confirmModalOpen"
      title="Confirmer la suppression"
      :message="confirmModalMessage"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </div>
</template>
