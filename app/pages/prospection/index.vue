<script setup lang="ts">
import type { Client } from '~/types'

const showArchived = ref(false)

const { data, refresh, status } = await useFetch('/api/clients/dashboard', {
  query: { scope: 'prospects', archived: showArchived }
})
const clients = computed<Client[]>(() => (data.value?.clients as Client[] | undefined) || [])
const isLoading = computed(() => status.value === 'pending' && !data.value)

const toggleArchived = () => {
  showArchived.value = !showArchived.value
}

const isClientModalOpen = ref(false)
const selectedClientId = ref<number | null>(null)

const selectedClient = computed<Client | null>(() => {
  if (!selectedClientId.value) return null
  return clients.value.find(c => c.id === selectedClientId.value) ?? null
})

const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()
const { setArchived } = useArchiveAction()

const openEditProspect = (clientId: number) => {
  selectedClientId.value = clientId
  isClientModalOpen.value = true
}

const onDeleteProspect = async (clientId: number) => {
  await deleteResource('prospect', clientId, '/api/clients', refresh)
}

const onRestoreProspect = async (clientId: number) => {
  await setArchived('prospect', clientId, '/api/clients', false, refresh)
}
</script>

<template>
  <div class="container mx-auto p-6">
    <div
      v-if="isLoading"
      class="space-y-4"
    >
      <USkeleton class="h-10 w-64" />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-96"
        />
      </div>
    </div>

    <template v-else>
      <AppListHeader
        title="Prospection"
        level="h1"
        :count="clients.length"
        class="mb-6"
      >
        <template #actions>
          <UButton
            :icon="showArchived ? 'i-lucide-kanban' : 'i-lucide-archive'"
            variant="ghost"
            color="neutral"
            @click="toggleArchived"
          >
            {{ showArchived ? 'Voir le tableau de prospection' : 'Voir les prospects archivés' }}
          </UButton>
        </template>
      </AppListHeader>

      <ProspectsBoard
        v-if="!showArchived"
        :clients="clients"
        @refresh="refresh"
      />

      <template v-else>
        <AppEmptyState
          v-if="clients.length === 0"
          icon="i-lucide-archive"
          title="Aucun prospect archivé"
        />

        <TransitionGroup
          v-else
          name="list"
          tag="ul"
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
                @edit="openEditProspect"
                @delete="onDeleteProspect"
                @restore="onRestoreProspect"
              />
            </NuxtLink>
          </li>
        </TransitionGroup>

        <ClientsModal
          v-model:open="isClientModalOpen"
          :client-id="selectedClientId"
          :client="selectedClient"
          @saved="() => refresh()"
        />
      </template>
    </template>

    <ConfirmModal
      :open="confirmModalOpen"
      title="Confirmer la suppression"
      :message="confirmModalMessage"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </div>
</template>
