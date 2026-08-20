<script setup lang="ts">
import type { TaskAttachment } from '~/types'

const props = defineProps<{
  attachments: TaskAttachment[]
  taskId: number
}>()

const emit = defineEmits<{
  refresh: []
}>()

const isModalOpen = ref(false)
const selectedAttachmentId = ref<number | null>(null)

const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()

const sortedAttachments = computed(() => (
  [...props.attachments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
))

const onSaved = async () => {
  emit('refresh')
}

const onDeleteAttachment = async (attachmentId: number) => {
  await deleteResource('pièce jointe', attachmentId, '/api/task-attachments', async () => {
    emit('refresh')
  })
}

const openEditAttachment = (attachmentId: number) => {
  selectedAttachmentId.value = attachmentId
  isModalOpen.value = true
}

const attachmentToEdit = computed(() => {
  if (!selectedAttachmentId.value) return null
  return props.attachments.find(a => a.id === selectedAttachmentId.value) ?? null
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-slate-900">
          Documents & liens
        </h2>
        <p class="text-sm text-gray-500">
          Fichiers et liens utiles pour cette tâche.
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        variant="soft"
        color="neutral"
        @click="isModalOpen = true"
      >
        Ajouter
      </UButton>
    </div>

    <div
      v-if="sortedAttachments.length"
      class="grid grid-cols-1 gap-4"
    >
      <div
        v-for="attachment in sortedAttachments"
        :key="attachment.id"
        class="flex items-start justify-between gap-4 rounded-xl border border-default p-4"
      >
        <ResourcesCard
          :resource="attachment"
          @delete="onDeleteAttachment"
          @edit="openEditAttachment"
        />
      </div>
    </div>

    <AppEmptyState
      v-else
      variant="compact"
      icon="i-lucide-folder-open"
      title="Aucun document pour cette tâche"
      description="Ajoutez un fichier ou un lien utile pour cette tâche."
    />

    <TaskAttachmentsModal
      v-model:open="isModalOpen"
      :task-id="taskId"
      :attachment="attachmentToEdit"
      @saved="onSaved"
    />

    <ConfirmModal
      :open="confirmModalOpen"
      title="Confirmer la suppression"
      :message="confirmModalMessage"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </div>
</template>
