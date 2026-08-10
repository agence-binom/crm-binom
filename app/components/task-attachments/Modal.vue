<script setup lang="ts">
import { taskAttachmentTypes, type TaskAttachmentType } from '~/constants/task-attachments'
import { getTaskAttachmentTypeIcon, getTaskAttachmentTypeLabel } from '~/lib/task-attachments'
import { formatFileSize } from '~/lib/utils'
import { taskAttachmentFileInputAccept, taskAttachmentMaxSizeBytes } from '~/validation/task-attachments'
import type { TaskAttachment } from '~/types'

const props = defineProps<{
  open: boolean
  taskId: number
  attachment?: TaskAttachment | null
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saved': []
}>()

const { showError } = useFeedbackToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isSaving = ref(false)
const isEditing = computed(() => Boolean(props.attachment))

const modalTitle = computed(() => (isEditing.value ? 'Modifier la pièce jointe' : 'Ajouter un document ou un lien'))
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : 'Ajouter'))

const selectedType = ref<TaskAttachmentType>('document')
const name = ref('')
const description = ref('')
const url = ref('')
const selectedFile = ref<File | null>(null)

const typeOptions = taskAttachmentTypes.map(type => ({
  label: getTaskAttachmentTypeLabel(type),
  value: type,
  icon: getTaskAttachmentTypeIcon(type)
}))

const maxFileSizeLabel = formatFileSize(taskAttachmentMaxSizeBytes)

const resetForm = () => {
  selectedType.value = 'document'
  name.value = ''
  description.value = ''
  url.value = ''
  selectedFile.value = null
}

const fillFromAttachment = (attachment: TaskAttachment) => {
  selectedType.value = attachment.type
  name.value = attachment.name ?? ''
  description.value = attachment.description ?? ''
  url.value = attachment.type === 'link' ? (attachment.url ?? '') : ''
  selectedFile.value = null
}

watch(
  () => [props.open, props.attachment] as const,
  ([open, attachment]) => {
    if (!open) return
    if (attachment) fillFromAttachment(attachment)
    else resetForm()
  }
)

const isValid = computed(() => {
  if (!name.value.trim()) return false
  if (selectedType.value === 'document') return isEditing.value || Boolean(selectedFile.value)
  return Boolean(url.value.trim())
})

const onSubmit = async () => {
  if (!isValid.value) return

  isSaving.value = true

  try {
    if (isEditing.value) {
      if (!props.attachment) throw new Error('attachment manquant pour la mise à jour')

      await $fetch(`/api/task-attachments/${props.attachment.id}`, {
        method: 'PUT',
        body: {
          name: name.value.trim(),
          description: description.value.trim(),
          ...(selectedType.value === 'link' ? { url: url.value.trim() } : {})
        }
      })
    } else if (selectedType.value === 'document') {
      const formData = new FormData()
      formData.set('file', selectedFile.value as File)
      formData.set('taskId', String(props.taskId))
      formData.set('name', name.value.trim())
      formData.set('description', description.value.trim())

      await $fetch('/api/task-attachments/upload', { method: 'POST', body: formData })
    } else {
      await $fetch('/api/task-attachments', {
        method: 'POST',
        body: {
          type: 'link',
          taskId: props.taskId,
          name: name.value.trim(),
          description: description.value.trim(),
          url: url.value.trim()
        }
      })
    }

    emit('saved')
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la pièce jointe:', error)
    showError(
      'Enregistrement impossible',
      error,
      isEditing.value ? 'Impossible de mettre à jour la pièce jointe.' : 'Impossible d\'ajouter la pièce jointe.'
    )
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    :aria-describedby="isEditing ? 'Modifier les informations de la pièce jointe' : 'Ajouter un document ou un lien à la tâche'"
    :close="{
      color: 'error',
      variant: 'solid',
      icon: 'i-lucide-x',
      size: 'xs',
      label: 'Fermer'
    }"
    class="w-full max-w-2xl rounded-2xl"
  >
    <template #body>
      <div class="space-y-6">
        <div class="space-y-2.5">
          <p class="text-sm font-medium text-slate-700">
            Type
          </p>
          <AttachmentTypeSelector
            v-model="selectedType"
            :options="typeOptions"
            :locked="isEditing"
          />
        </div>

        <UFormField
          label="Nom"
          name="name"
          required
        >
          <UInput
            v-model="name"
            placeholder="Ex: Cahier des charges"
            class="w-full"
          />
        </UFormField>

        <div
          v-if="selectedType === 'document'"
          class="space-y-3"
        >
          <label class="text-sm font-medium text-slate-700">
            Fichier
          </label>
          <AttachmentFileInput
            v-model="selectedFile"
            :accept="taskAttachmentFileInputAccept"
            :max-size-bytes="taskAttachmentMaxSizeBytes"
            :max-size-label="maxFileSizeLabel"
            :locked="isEditing"
            :locked-filename="attachment?.filename"
            :locked-file-size="attachment?.size"
          />
        </div>

        <UFormField
          v-else
          label="Lien"
          name="url"
          required
        >
          <UInput
            v-model="url"
            type="url"
            placeholder="https://..."
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Description"
          name="description"
        >
          <UInput
            v-model="description"
            placeholder="Décris brièvement le document ou le lien si nécessaire."
            class="w-full"
          />
        </UFormField>

        <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
          <UButton
            color="neutral"
            variant="soft"
            :disabled="isSaving"
            @click="isOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            :disabled="!isValid || isSaving"
            :loading="isSaving"
            :icon="isEditing ? 'i-lucide-check' : 'i-lucide-plus'"
            @click="onSubmit"
          >
            {{ submitLabel }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
