<script setup lang="ts">
import { formatFileSize, getFileTypeIcon } from '~/lib/utils'
import { getTaskAttachmentTypeColor, getTaskAttachmentTypeIcon, getTaskAttachmentTypeLabel } from '~/lib/task-attachments'
import type { TaskAttachment } from '~/types'

const props = defineProps<{
  attachment: TaskAttachment
}>()

defineEmits<{
  delete: [attachmentId: number]
}>()

const icon = computed(() => (
  props.attachment.type === 'document'
    ? getFileTypeIcon(props.attachment.mimetype)
    : getTaskAttachmentTypeIcon(props.attachment.type)
))

const getExternalHref = (attachment: TaskAttachment) => {
  if (attachment.type === 'link') return attachment.url ?? undefined
  return attachment.downloadUrl ?? undefined
}
</script>

<template>
  <AppAttachmentMeta
    :icon="icon"
    :description="attachment.description"
    :created-at="attachment.createdAt"
  >
    <template #title>
      <p class="truncate font-medium">
        {{ attachment.name }}
      </p>
      <UBadge
        variant="soft"
        :color="getTaskAttachmentTypeColor(attachment.type)"
      >
        {{ getTaskAttachmentTypeLabel(attachment.type) }}
      </UBadge>
    </template>

    <template #meta>
      <p
        v-if="attachment.type === 'document'"
        class="mt-1 text-sm text-gray-600"
      >
        {{ attachment.filename }} • {{ formatFileSize(attachment.size || 0) }}
      </p>

      <p
        v-else-if="attachment.type === 'link'"
        class="mt-1 truncate text-sm text-gray-600"
      >
        {{ attachment.url }}
      </p>
    </template>
  </AppAttachmentMeta>

  <div class="flex shrink-0 items-center gap-2">
    <UButton
      size="sm"
      variant="soft"
      color="primary"
      :icon="attachment.type === 'link' ? 'i-lucide-external-link' : 'i-lucide-download'"
      :href="getExternalHref(attachment)"
      :disabled="!getExternalHref(attachment)"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ attachment.type === 'link' ? 'Ouvrir le lien' : 'Télécharger' }}
    </UButton>
    <UButton
      size="sm"
      variant="soft"
      color="error"
      icon="i-lucide-trash-2"
      aria-label="Supprimer la pièce jointe"
      @click="$emit('delete', attachment.id)"
    />
  </div>
</template>
