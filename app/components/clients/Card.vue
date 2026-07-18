<script setup lang="ts">
import type { Client } from '~/types'

const props = defineProps<{
  client: Client
}>()

const emit = defineEmits<{
  delete: [clientId: number]
  edit: [clientId: number]
  archive: [clientId: number]
  restore: [clientId: number]
}>()

const infos = computed(() => [
  props.client.email ? { icon: 'i-lucide-mail', label: props.client.email } : null,
  props.client.phone ? { icon: 'i-lucide-phone', label: props.client.phone } : null,
  props.client.website ? { icon: 'i-lucide-globe', label: 'Site web' } : null
].filter(i => i !== null))
</script>

<template>
  <AppCard
    :title="client.name"
    :subtitle="client.description ?? undefined"
    :badge="client.archived ? { label: 'Archivé' } : undefined"
    :infos="infos"
    hoverable
  >
    <template #actions>
      <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-pencil"
          aria-label="Modifier le client"
          @click.prevent.stop="emit('edit', client.id)"
        />
        <UButton
          v-if="!client.archived"
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-archive"
          aria-label="Archiver le client"
          @click.prevent.stop="emit('archive', client.id)"
        />
        <template v-else>
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-archive-restore"
            aria-label="Restaurer le client"
            @click.prevent.stop="emit('restore', client.id)"
          />
          <UButton
            size="xs"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            aria-label="Supprimer le client"
            @click.prevent.stop="emit('delete', client.id)"
          />
        </template>
      </div>
    </template>
  </AppCard>
</template>
