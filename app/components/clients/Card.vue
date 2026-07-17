<script setup lang="ts">
import type { Client } from '~/types'
import { clientStatusOptions, normalizeClientStatus } from '~/lib/clients'

const props = defineProps<{
  client: Client
}>()

const emit = defineEmits<{
  delete: [clientId: number]
  edit: [clientId: number]
}>()

const infos = computed(() => [
  props.client.email ? { icon: 'i-lucide-mail', label: props.client.email } : null,
  props.client.phone ? { icon: 'i-lucide-phone', label: props.client.phone } : null,
  props.client.website ? { icon: 'i-lucide-globe', label: 'Site web' } : null
].filter(i => i !== null))

const statusLabel = computed(() =>
  clientStatusOptions.find(option => option.value === normalizeClientStatus(props.client.status))?.label ?? ''
)
</script>

<template>
  <AppCard
    :title="client.name"
    :subtitle="client.description ?? undefined"
    :badge="client.status === 'archived' ? { label: statusLabel } : undefined"
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
          size="xs"
          variant="ghost"
          color="error"
          icon="i-lucide-trash-2"
          aria-label="Supprimer le client"
          @click.prevent.stop="emit('delete', client.id)"
        />
      </div>
    </template>
  </AppCard>
</template>
