<script setup lang="ts">
const { data, refresh } = await useFetch('/api/clients')
const clients = computed(() => data.value?.clients || [])

const isClientModalOpen = ref(false)

const openCreateClient = () => {
  isClientModalOpen.value = true
}

const handleClientChange = async () => {
  await refresh()
}
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
      <h1 class="text-3xl font-bold">
        Clients
      </h1>
      <UButton
        icon="i-lucide-circle-plus"
        variant="outline"
        color="neutral"
        @click="openCreateClient"
      >
        Nouveau client
      </UButton>
    </div>

    <ClientModal
      v-model:open="isClientModalOpen"
      @saved="handleClientChange"
    />

    <div
      v-if="!data"
      class="text-center py-12"
    >
      Chargement...
    </div>

    <div
      v-else-if="clients.length === 0"
      class="text-center py-12"
    >
      <p class="text-gray-500 mb-4">
        Aucun client
      </p>
      <UButton
        icon="i-lucide-circle-plus"
        variant="outline"
        color="neutral"
        @click="openCreateClient"
      >
        Créer un client
      </UButton>
    </div>

    <ul
      v-else
      class="flex gap-8"
    >
      <li
        v-for="client in clients"
        :key="client.id"
      >
        <UPageCard
          :title="client.name"
          :description="client.description || ''"
          :icon="client.icon || 'i-lucide-briefcase'"
          variant="soft"
          :to="`/clients/${client.id}`"
          class="w-96"
        />
      </li>
    </ul>
  </div>
</template>
