<script setup lang="ts">
import { formatDate, formatFileSize, getFileTypeIcon } from '~/lib/utils'
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
  <div class="flex min-w-0 flex-1 items-start gap-3">
    <div class="rounded-lg bg-primary-50 p-2 text-primary-600 ">
      <UIcon
        :name="icon"
        mode="svg"
        size="lg"
      />
    </div>

    <div class="min-w-0 flex-1 space-y-1.5">
      <div class="flex flex-wrap items-center gap-2">
        <p class="truncate font-medium">
          {{ attachment.name }}
        </p>
        <UBadge
          variant="soft"
          :color="getTaskAttachmentTypeColor(attachment.type)"
        >
          {{ getTaskAttachmentTypeLabel(attachment.type) }}
        </UBadge>
      </div>

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

      <p
        v-if="attachment.description"
        class="mt-1 text-sm text-gray-500"
      >
        {{ attachment.description }}
      </p>

      <p class="mt-1 text-xs text-gray-400">
        Ajouté le {{ formatDate(attachment.createdAt) }}
      </p>
    </div>
  </div>

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
