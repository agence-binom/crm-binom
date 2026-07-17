<script setup lang="ts">
import type { Client } from '~/types'

const props = defineProps<{
  client: Client
}>()

const emit = defineEmits<{
  openInfo: []
  delete: [clientId: number]
  archive: [clientId: number]
  restore: [clientId: number]
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
          icon="i-lucide-edit"
          @click="emit('openInfo')"
        >
          Modifier les informations
        </UButton>
        <UButton
          v-if="!client.archived"
          size="sm"
          variant="ghost"
          color="neutral"
          icon="i-lucide-archive"
          aria-label="Archiver le client"
          @click="emit('archive', client.id)"
        />
        <template v-else>
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            icon="i-lucide-archive-restore"
            aria-label="Restaurer le client"
            @click="emit('restore', client.id)"
          />
          <UButton
            size="sm"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            aria-label="Supprimer le client"
            @click="emit('delete', client.id)"
          />
        </template>
      </div>
    </template>
  </AppPageHeader>
</template>
