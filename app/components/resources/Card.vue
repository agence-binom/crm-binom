<script setup lang="ts">
import { formatDate, formatFileSize, getFileTypeIcon } from '~/lib/utils'
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
    class="flex flex-1 min-w-0 items-start gap-3"
  >
    <div class="rounded-lg bg-primary-50 p-2 text-primary-600 ">
      <UIcon
        :name="icon"
        mode="svg"
        size="lg"
      />
    </div>

    <div class="min-w-0 flex-1 space-y-1.5">
      <p class="truncate font-medium">
        {{ resource.name }}
      </p>

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

      <p
        v-if="resource.description"
        class="mt-1 text-sm text-gray-500"
      >
        {{ resource.description }}
      </p>

      <p class="mt-1 text-xs text-gray-400">
        Ajouté le {{ formatDate(resource.createdAt) }}
      </p>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <!-- <UButton
      v-if="resource.type !== 'text'"
      size="sm"
      variant="soft"
      color="primary"
      :icon="resource.type === 'link' ? 'i-lucide-external-link' : 'i-lucide-download'"
      :href="getExternalHref(resource)"
      :disabled="!getExternalHref(resource)"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ resource.type === 'link' ? 'Ouvrir le lien' : 'Télécharger' }}
    </UButton> -->
      <UButton
        label="Modifier"
        size="sm"
        variant="soft"
        color="primary"
        icon="i-lucide-pencil"
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
  </component>
</template>
