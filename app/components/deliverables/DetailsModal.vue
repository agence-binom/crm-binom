<script setup lang="ts">
import { getDeliverableTypeIcon, getDeliverableTypeLabel } from '~/lib/deliverables'
import { formatDate, formatFileSize } from '~/lib/utils'
import type { ProjectDeliverable } from '~/types'

const props = defineProps<{
  open: boolean
  deliverable: ProjectDeliverable | null
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
    :title="deliverable?.name"
    aria-describedby="Informations détaillées sur le livrable"
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
        v-if="deliverable"
        class="space-y-4 text-sm"
      >
        <div class="flex items-center gap-2 text-slate-500">
          <UIcon
            :name="getDeliverableTypeIcon(deliverable.type)"
            class="size-4"
          />
          {{ getDeliverableTypeLabel(deliverable.type) }}
        </div>

        <p
          v-if="deliverable.description"
          class="whitespace-pre-line text-slate-700"
        >
          {{ deliverable.description }}
        </p>

        <div
          v-if="deliverable.type === 'document'"
          class="space-y-1 rounded-lg bg-slate-50 p-3"
        >
          <p class="font-medium text-slate-700">
            {{ deliverable.filename }}
          </p>
          <p class="text-xs text-slate-500">
            {{ formatFileSize(deliverable.size || 0) }}
          </p>
        </div>

        <a
          v-else-if="deliverable.type === 'link'"
          :href="deliverable.url ?? undefined"
          target="_blank"
          rel="noopener noreferrer"
          class="block truncate text-primary-600 underline"
        >
          {{ deliverable.url }}
        </a>

        <p
          v-else-if="deliverable.type === 'text'"
          class="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-slate-700"
        >
          {{ deliverable.content }}
        </p>

        <p class="text-xs text-slate-400">
          Ajouté le {{ formatDate(deliverable.createdAt) }}
        </p>
      </div>
    </template>
  </UModal>
</template>
