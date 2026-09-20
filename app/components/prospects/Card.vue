<script setup lang="ts">
import { lostProspectStatus } from '~/constants/prospection'
import { formatDateOnly } from '~/lib/utils'
import type { Client } from '~/types'

const props = defineProps<{
  client: Client
}>()

const emit = defineEmits<{
  edit: [clientId: number]
  archive: [clientId: number]
}>()

const infos = computed(() => [
  props.client.email ? { icon: 'i-lucide-mail', label: props.client.email } : null,
  props.client.phone ? { icon: 'i-lucide-phone', label: props.client.phone } : null,
  props.client.city ? { icon: 'i-lucide-map-pin', label: props.client.city } : null,
  props.client.website ? { icon: 'i-lucide-globe', label: 'Site web' } : null,
  props.client.contactedAt ? { icon: 'i-lucide-phone-call', label: `${formatDateOnly(props.client.contactedAt)}` } : null,
  props.client.relancedAt ? { icon: 'i-lucide-bell-ring', label: `${formatDateOnly(props.client.relancedAt)}` } : null
].filter(i => i !== null))
</script>

<template>
  <div class="flex items-start gap-2">
    <UIcon
      name="i-lucide-grip-vertical"
      class="kanban-handle mt-4 shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
    />
    <NuxtLink
      :to="`/clients/${client.id}`"
      class="block flex-1"
    >
      <AppCard
        :title="client.name"
        :subtitle="client.description ?? undefined"
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
              aria-label="Modifier le prospect"
              @click.prevent.stop="emit('edit', client.id)"
            />
            <UButton
              v-if="client.prospectionStatus !== lostProspectStatus"
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-lucide-archive"
              aria-label="Archiver le prospect"
              @click.prevent.stop="emit('archive', client.id)"
            />
          </div>
        </template>
      </AppCard>
    </NuxtLink>
  </div>
</template>
