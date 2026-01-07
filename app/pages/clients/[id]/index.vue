<script setup lang="ts">
const route = useRoute()
const clientId = computed(() => Number(route.params.id))
const { data, refresh } = await useFetch(`/api/clients/${clientId.value}`)
const client = computed(() => data.value?.client)

const isClientInfoModalOpen = ref(false)

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

const handleClientChange = async () => {
  await refresh()
}
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold mb-6">
        {{ client?.name }}
      </h1>
      <UButton
        variant="soft"
        icon="i-lucide-info"
        color="info"
        @click="isClientInfoModalOpen = true"
      >
        Informations
      </UButton>
      <ClientModal
        v-model:open="isClientInfoModalOpen"
        :client="client"
        @saved="handleClientChange"
      />
    </div>
    <div
      v-if="client"
      class="flex flex-col gap-2"
    >
      <div class="flex items-center gap-2 w-full justify-end">
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
</template>
