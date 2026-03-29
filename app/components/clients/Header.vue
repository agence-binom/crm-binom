<script setup lang="ts">
import type { Client } from '~/types'

const props = defineProps<{
  client: Client
}>()

const emit = defineEmits<{
  openInfo: []
  delete: [clientId: number]
}>()

const infos = computed(() => [
  { value: props.client?.email, icon: 'i-lucide-mail' },
  { value: props.client?.phone, icon: 'i-lucide-phone' },
  { value: props.client?.website, icon: 'i-lucide-globe' }
])
</script>

<template>
  <AppPageHeader
    :title="client.name"
    :subtitle="client.description"
    :infos="infos"
  >
    <template #actions>
      <div class="flex items-center gap-2">
        <UButton
          size="sm"
          variant="soft"
          color="neutral"
          icon="i-lucide-info"
          @click="emit('openInfo')"
        >
          Informations
        </UButton>
        <UButton
          size="sm"
          variant="ghost"
          color="error"
          icon="i-lucide-trash"
          aria-label="Supprimer le client"
          @click="emit('delete', client.id)"
        />
      </div>
    </template>
  </AppPageHeader>
</template>
