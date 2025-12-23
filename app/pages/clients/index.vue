<script setup lang="ts">
const { data, refresh } = await useFetch('/api/clients')
const clients = computed(() => data.value?.clients || [])

const onDeleteClient = async (clientId: number) => {
  try {
    const { error } = await useFetch(`/api/clients/${clientId}`, {
      method: 'DELETE'
    })

    if (error.value) {
      console.error('Erreur lors de la suppression du client:', error.value)
      return
    }
    await refresh()
  } catch (err) {
    console.error('Erreur lors de la suppression du client:', err)
  }
}
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">
        Clients
      </h1>
      <UButton to="/clients/new">
        Nouveau client
      </UButton>
    </div>

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
      <UButton to="/clients/new">
        Créer un client
      </UButton>
    </div>

    <ul
      v-else
      class="divide-y divide-gray-200 bg-white rounded-lg shadow"
    >
      <li
        v-for="client in clients"
        :key="client.id"
        class="p-4 hover:bg-gray-50"
      >
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-medium text-gray-900">
              {{ client.name }}
            </h3>
            <p class="text-sm text-gray-500">
              {{ client.email || 'Pas d\'email' }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="text-sm text-gray-500">
                {{ client.phone || 'Pas de téléphone' }}
              </p>
              <p class="text-sm text-gray-400">
                {{ client.city || '' }}
              </p>
            </div>
            <div class="flex gap-2">
              <UButton
                size="sm"
                variant="ghost"
                icon="i-lucide-users"
                :to="`/clients/${client.id}/contacts`"
              />
              <UButton
                size="sm"
                variant="ghost"
                icon="i-lucide-folder"
                :to="`/clients/${client.id}/projects`"
              />
              <UButton
                size="sm"
                variant="ghost"
                color="error"
                icon="i-lucide-trash"
                @click="onDeleteClient(client.id)"
              />
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
