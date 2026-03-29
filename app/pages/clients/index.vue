<script setup lang="ts">
import type { Client } from '~/types'

const { data, refresh } = await useFetch('/api/clients/dashboard')
const clients = computed(() => data.value?.clients || [])

const isClientModalOpen = ref(false)
const selectedClientId = ref<number | null>(null)

const selectedClient = computed<Client | null>(() => {
  if (!selectedClientId.value) return null
  return clients.value.find((c: Client) => c.id === selectedClientId.value) ?? null
})

const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()

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

const handleClientChange = async () => {
  await refresh()
}
</script>

<template>
  <div class="container mx-auto space-y-6 p-6">
    <div class="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
          Clients
        </h1>
        <UBadge
          color="neutral"
          variant="soft"
          class="rounded-full"
        >
          {{ clients.length }}
        </UBadge>
      </div>
      <UButton
        icon="i-lucide-circle-plus"
        variant="soft"
        color="neutral"
        @click="openCreateClient"
      >
        Nouveau client
      </UButton>
    </div>

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

    <div
      v-else-if="clients.length === 0"
      class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 px-6 py-12 text-center"
    >
      <UIcon
        name="i-lucide-building-2"
        class="mb-3 text-4xl text-slate-300"
      />
      <p class="mb-4 text-slate-500">
        Aucun client
      </p>
      <UButton
        icon="i-lucide-circle-plus"
        variant="soft"
        color="neutral"
        @click="openCreateClient"
      >
        Créer un client
      </UButton>
    </div>

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
