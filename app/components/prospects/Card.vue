<script setup lang="ts">
import type { Client } from '~/types'

const props = defineProps<{
  client: Client
}>()

const infos = computed(() => [
  props.client.email ? { icon: 'i-lucide-mail', label: props.client.email } : null,
  props.client.phone ? { icon: 'i-lucide-phone', label: props.client.phone } : null
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
      />
    </NuxtLink>
  </div>
</template>
