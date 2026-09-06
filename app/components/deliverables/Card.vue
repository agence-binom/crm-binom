<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { formatFileSize, getFileTypeIcon } from '~/lib/utils'
import { getDeliverableTypeIcon } from '~/lib/deliverables'
import type { ProjectDeliverable } from '~/types'

const props = withDefaults(defineProps<{
  deliverable: ProjectDeliverable
  readonly?: boolean
}>(), {
  readonly: false
})

const emit = defineEmits<{
  delete: [deliverableId: number]
  edit: [deliverableId: number]
}>()

const { isDetailsOpen, menuItems: detailsMenuItem } = useDetailsMenuItem()

const icon = computed(() => (
  props.deliverable.type === 'document'
    ? getFileTypeIcon(props.deliverable.mimetype)
    : getDeliverableTypeIcon(props.deliverable.type)
))

const href = computed(() => {
  if (props.deliverable.type === 'link') return props.deliverable.url ?? undefined
  if (props.deliverable.type === 'document') return props.deliverable.downloadUrl ?? undefined
  return undefined
})

const menuItems = computed<DropdownMenuItem[][]>(() => {
  if (props.readonly) return detailsMenuItem

  return [
    ...detailsMenuItem,
    [
      {
        label: 'Modifier',
        icon: 'i-lucide-pencil',
        onSelect: () => emit('edit', props.deliverable.id)
      },
      {
        label: 'Supprimer',
        icon: 'i-lucide-trash-2',
        color: 'error',
        onSelect: () => emit('delete', props.deliverable.id)
      }
    ]
  ]
})
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
    <div class="flex min-w-0 flex-1 items-center gap-2.5">
      <UIcon
        :name="icon"
        class="size-4 shrink-0 text-slate-400"
      />

      <div class="min-w-0">
        <p
          class="truncate text-sm font-medium text-slate-700"
          :title="deliverable.name"
        >
          {{ deliverable.name }}
        </p>
        <p
          v-if="deliverable.type === 'document'"
          class="truncate text-xs text-slate-500"
        >
          {{ deliverable.filename }} • {{ formatFileSize(deliverable.size || 0) }}
        </p>
        <p
          v-else-if="deliverable.type === 'link'"
          class="truncate text-xs text-slate-500"
        >
          {{ deliverable.url }}
        </p>
        <p
          v-else-if="deliverable.type === 'text'"
          class="truncate text-xs text-slate-500"
        >
          {{ deliverable.content }}
        </p>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-1.5">
      <template v-if="deliverable.type === 'document'">
        <UTooltip text="Aperçu">
          <UButton
            size="sm"
            variant="soft"
            color="neutral"
            icon="i-lucide-eye"
            :href="href"
            :disabled="!href"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Aperçu du livrable"
          />
        </UTooltip>
        <UTooltip text="Télécharger">
          <UButton
            size="sm"
            variant="soft"
            color="neutral"
            icon="i-lucide-download"
            :href="href"
            :disabled="!href"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Télécharger le livrable"
          />
        </UTooltip>
      </template>

      <UTooltip
        v-else-if="deliverable.type === 'link'"
        text="Ouvrir le lien"
      >
        <UButton
          size="sm"
          variant="soft"
          color="neutral"
          icon="i-lucide-external-link"
          :href="href"
          :disabled="!href"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ouvrir le lien"
        />
      </UTooltip>

      <AppActionsMenu :items="menuItems" />
    </div>
  </div>

  <DeliverablesDetailsModal
    v-model:open="isDetailsOpen"
    :deliverable="deliverable"
  />
</template>
