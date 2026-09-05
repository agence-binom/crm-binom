<script setup lang="ts">
import { formatFileSize, getFileTypeIcon } from '~/lib/utils'
import { getResourceTypeIcon } from '~/lib/resources'
import type { ProjectResource } from '~/types'

const props = defineProps<{
  resource: ProjectResource
}>()

defineEmits<{
  delete: [resourceId: number]
  edit: [resourceId: number]
}>()

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
</script>

<template>
  <component
    :is="href ? 'a' : 'div'"
    :href="href"
    :target="href ? '_blank' : undefined"
    :rel="href && resource.type === 'link' ? 'noopener noreferrer' : undefined"
    class="flex min-w-0 flex-1"
  >
    <AppAttachmentMeta
      :icon="icon"
      :description="resource.description"
      :created-at="resource.createdAt"
    >
      <template #title>
        <p class="truncate font-medium">
          {{ resource.name }}
        </p>
      </template>

      <template #meta>
        <p
          v-if="resource.type === 'document'"
          class="mt-1 text-sm text-gray-600"
        >
          {{ resource.filename }} • {{ formatFileSize(resource.size || 0) }}
        </p>

        <p
          v-else-if="resource.type === 'link'"
          class="mt-1 truncate text-sm text-gray-600"
        >
          {{ resource.url }}
        </p>

        <p
          v-else-if="resource.type === 'text'"
          class="mt-1 line-clamp-3 text-sm text-gray-600 whitespace-pre-line bg-gray-50 rounded-md p-2"
        >
          {{ resource.content }}
        </p>
      </template>
    </AppAttachmentMeta>
  </component>

  <slot name="actions">
    <div class="flex shrink-0 items-center gap-2">
      <UButton
        size="sm"
        variant="soft"
        color="neutral"
        icon="i-lucide-pencil"
        aria-label="Modifier la ressource"
        @click.prevent="$emit('edit', resource.id)"
      />
      <UButton
        size="sm"
        variant="soft"
        color="error"
        icon="i-lucide-trash-2"
        aria-label="Supprimer la ressource"
        @click.prevent="$emit('delete', resource.id)"
      />
    </div>
  </slot>
</template>
