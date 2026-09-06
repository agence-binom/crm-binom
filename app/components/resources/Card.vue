<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { formatFileSize, getFileTypeIcon } from '~/lib/utils'
import { getResourceTypeIcon } from '~/lib/resources'
import type { ProjectResource } from '~/types'

const props = withDefaults(defineProps<{
  resource: ProjectResource
  readonly?: boolean
}>(), {
  readonly: false
})

const emit = defineEmits<{
  delete: [resourceId: number]
  edit: [resourceId: number]
}>()

const { isDetailsOpen, menuItems: detailsMenuItem } = useDetailsMenuItem()

const icon = computed(() => (
  props.resource.type === 'document'
    ? getFileTypeIcon(props.resource.mimetype)
    : getResourceTypeIcon(props.resource.type)
))

const getExternalHref = (resource: ProjectResource) => {
  if (resource.type === 'link') return resource.url ?? undefined
  if (resource.type === 'document') return resource.downloadUrl ?? undefined
  return undefined
}

const href = computed(() => getExternalHref(props.resource))

const menuItems = computed<DropdownMenuItem[][]>(() => {
  if (props.readonly) return detailsMenuItem

  return [
    ...detailsMenuItem,
    [
      {
        label: 'Modifier',
        icon: 'i-lucide-pencil',
        onSelect: () => emit('edit', props.resource.id)
      },
      {
        label: 'Supprimer',
        icon: 'i-lucide-trash-2',
        color: 'error',
        onSelect: () => emit('delete', props.resource.id)
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
          :title="resource.name"
        >
          {{ resource.name }}
        </p>
        <p
          v-if="resource.type === 'document'"
          class="truncate text-xs text-slate-500"
        >
          {{ resource.filename }} • {{ formatFileSize(resource.size || 0) }}
        </p>
        <p
          v-else-if="resource.type === 'link'"
          class="truncate text-xs text-slate-500"
        >
          {{ resource.url }}
        </p>
        <p
          v-else-if="resource.type === 'text'"
          class="truncate text-xs text-slate-500"
        >
          {{ resource.content }}
        </p>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-1.5">
      <template v-if="resource.type === 'document'">
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
            aria-label="Aperçu de la ressource"
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
            aria-label="Télécharger la ressource"
          />
        </UTooltip>
      </template>

      <UTooltip
        v-else-if="resource.type === 'link'"
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

  <ResourcesDetailsModal
    v-model:open="isDetailsOpen"
    :resource="resource"
  />
</template>
