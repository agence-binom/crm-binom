<script setup lang="ts">
import { getResourceTypeIcon, getResourceTypeLabel } from '~/lib/resources'
import { formatDate, formatFileSize } from '~/lib/utils'
import type { ProjectResource } from '~/types'

const props = defineProps<{
  open: boolean
  resource: ProjectResource | null
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="resource?.name"
    aria-describedby="Informations détaillées sur la ressource"
    :close="{
      color: 'error',
      variant: 'solid',
      icon: 'i-lucide-x',
      size: 'xs',
      label: 'Fermer'
    }"
    class="w-full max-w-lg rounded-2xl"
  >
    <template #body>
      <div
        v-if="resource"
        class="space-y-4 text-sm"
      >
        <div class="flex items-center gap-2 text-slate-500">
          <UIcon
            :name="getResourceTypeIcon(resource.type)"
            class="size-4"
          />
          {{ getResourceTypeLabel(resource.type) }}
        </div>

        <p
          v-if="resource.description"
          class="whitespace-pre-line text-slate-700"
        >
          {{ resource.description }}
        </p>

        <div
          v-if="resource.type === 'document'"
          class="space-y-1 rounded-lg bg-slate-50 p-3"
        >
          <p class="font-medium text-slate-700">
            {{ resource.filename }}
          </p>
          <p class="text-xs text-slate-500">
            {{ formatFileSize(resource.size || 0) }}
          </p>
        </div>

        <a
          v-else-if="resource.type === 'link'"
          :href="resource.url ?? undefined"
          target="_blank"
          rel="noopener noreferrer"
          class="block truncate text-primary-600 underline"
        >
          {{ resource.url }}
        </a>

        <p
          v-else-if="resource.type === 'text'"
          class="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-slate-700"
        >
          {{ resource.content }}
        </p>

        <p class="text-xs text-slate-400">
          Ajouté le {{ formatDate(resource.createdAt) }}
        </p>
      </div>
    </template>
  </UModal>
</template>
