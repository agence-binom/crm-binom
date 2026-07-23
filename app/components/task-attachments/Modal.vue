<script setup lang="ts">
import { taskAttachmentTypes } from '~/constants/task-attachments'
import type { TaskAttachmentType } from '~/constants/task-attachments'
import { getTaskAttachmentTypeIcon, getTaskAttachmentTypeLabel } from '~/lib/task-attachments'
import { formatFileSize } from '~/lib/utils'
import { taskAttachmentFileInputAccept, taskAttachmentMaxSizeBytes } from '~/validation/task-attachments'

const props = defineProps<{
  open: boolean
  taskId: number
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saved': []
}>()

const toast = useToast()
const { showError } = useFeedbackToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isSaving = ref(false)
const selectedType = ref<TaskAttachmentType>('document')
const name = ref('')
const description = ref('')
const url = ref('')
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()

const typeOptions = taskAttachmentTypes.map(type => ({
  label: getTaskAttachmentTypeLabel(type),
  value: type,
  icon: getTaskAttachmentTypeIcon(type)
}))

const maxFileSizeLabel = formatFileSize(taskAttachmentMaxSizeBytes)

const clearSelectedFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const resetForm = () => {
  selectedType.value = 'document'
  name.value = ''
  description.value = ''
  url.value = ''
  clearSelectedFile()
}

watch(
  () => props.open,
  (open) => {
    if (open) resetForm()
  }
)

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null

  if (!file) {
    clearSelectedFile()
    return
  }

  if (file.size > taskAttachmentMaxSizeBytes) {
    clearSelectedFile()
    toast.add({
      title: 'Fichier refusé',
      description: `Le fichier dépasse la taille maximale autorisée de ${maxFileSizeLabel}.`,
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
    return
  }

  selectedFile.value = file
}

const isValid = computed(() => {
  if (!name.value.trim()) return false
  if (selectedType.value === 'document') return Boolean(selectedFile.value)
  return Boolean(url.value.trim())
})

const onSubmit = async () => {
  if (!isValid.value) return

  isSaving.value = true

  try {
    if (selectedType.value === 'document') {
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
    showError('Enregistrement impossible', error, 'Impossible d\'ajouter la pièce jointe.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Ajouter un document ou un lien"
    aria-describedby="Ajouter un document ou un lien à la tâche"
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
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="option in typeOptions"
              :key="option.value"
              type="button"
              variant="soft"
              color="neutral"
              :class="[
                'rounded-full px-3.5 transition-colors',
                selectedType === option.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-200/70'
              ]"
              @click="selectedType = option.value"
            >
              <UIcon
                :name="option.icon"
                class="mr-1"
              />
              {{ option.label }}
            </UButton>
          </div>
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
          <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
            <input
              ref="fileInput"
              type="file"
              :accept="taskAttachmentFileInputAccept"
              class="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
              @change="onFileSelected"
            >
            <p class="mt-3 text-xs text-slate-500">
              Formats acceptés : PDF, images, Word, Excel. Taille maximale : {{ maxFileSizeLabel }}.
            </p>
            <p
              v-if="selectedFile"
              class="mt-2 text-sm font-medium text-slate-700"
            >
              {{ selectedFile.name }}
            </p>
          </div>
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
            icon="i-lucide-plus"
            @click="onSubmit"
          >
            Ajouter
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
