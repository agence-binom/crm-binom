<script setup lang="ts">
import { deliverableCreateSchema, deliverableUpdateSchema, deliverableFileInputAccept, deliverableMaxSizeBytes } from '~/validation/deliverables'
import { deliverableTypes, type DeliverableType } from '~/constants/deliverables'
import { getDeliverableTypeIcon, getDeliverableTypeLabel } from '~/lib/deliverables'
import { formatFileSize } from '~/lib/utils'
import type { ProjectDeliverable } from '~/types'

const props = defineProps<{
  open: boolean
  projectId: number
  deliverable?: ProjectDeliverable | null
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
const isEditing = computed(() => Boolean(props.deliverable))

const schema = computed(() => (isEditing.value ? deliverableUpdateSchema : deliverableCreateSchema))
const modalTitle = computed(() => (isEditing.value ? 'Modifier le livrable' : 'Nouveau livrable'))
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : 'Créer le livrable'))

const formState = reactive({
  type: 'document' as DeliverableType,
  name: '',
  description: '',
  url: '',
  content: ''
})

const selectedType = ref<DeliverableType>('document')
const name = ref('')
const description = ref('')
const url = ref('')
const content = ref('')
const selectedFiles = ref<File[]>([])

const typeOptions = deliverableTypes.map(type => ({
  label: getDeliverableTypeLabel(type),
  value: type,
  icon: getDeliverableTypeIcon(type)
}))

const maxFileSizeLabel = formatFileSize(deliverableMaxSizeBytes)

const resetForm = () => {
  selectedType.value = 'document'
  name.value = ''
  description.value = ''
  url.value = ''
  content.value = ''
  selectedFiles.value = []
}

const fillFromDeliverable = (deliverable: ProjectDeliverable) => {
  selectedType.value = deliverable.type
  name.value = deliverable.name ?? ''
  description.value = deliverable.description ?? ''
  url.value = deliverable.type === 'link' ? (deliverable.url ?? '') : ''
  content.value = deliverable.type === 'text' ? (deliverable.content ?? '') : ''
  selectedFiles.value = []
}

watch(
  () => [props.open, props.deliverable] as const,
  ([open, deliverable]) => {
    if (!open) return
    if (deliverable) fillFromDeliverable(deliverable)
    else resetForm()
  }
)

const isMultipleFiles = computed(() => selectedFiles.value.length > 1)

const isValid = computed(() => {
  if (selectedType.value === 'document') {
    if (isEditing.value) return Boolean(name.value.trim())
    if (isMultipleFiles.value) return selectedFiles.value.length > 0
    return Boolean(name.value.trim()) && selectedFiles.value.length > 0
  }
  if (!name.value.trim()) return false
  if (selectedType.value === 'link') return Boolean(url.value.trim())
  return Boolean(content.value.trim())
})

const onSubmit = async () => {
  if (!isValid.value) return

  isSaving.value = true

  try {
    if (isEditing.value) {
      if (!props.deliverable) throw new Error('livrable manquant pour la mise à jour')

      await $fetch(`/api/deliverables/${props.deliverable.id}`, {
        method: 'PUT',
        body: {
          name: name.value.trim(),
          description: description.value.trim(),
          ...(selectedType.value === 'link' ? { url: url.value.trim() } : {}),
          ...(selectedType.value === 'text' ? { content: content.value } : {})
        }
      })
    } else if (selectedType.value === 'document') {
      const filesToUpload = selectedFiles.value
      const sharedName = isMultipleFiles.value ? '' : name.value.trim()

      const results = await Promise.allSettled(filesToUpload.map((file) => {
        const formData = new FormData()
        formData.set('file', file)
        formData.set('projectId', String(props.projectId))
        formData.set('name', sharedName)
        formData.set('description', description.value.trim())

        return $fetch('/api/deliverables/upload', { method: 'POST', body: formData })
      }))

      const failures = results
        .map((result, index) => ({ result, file: filesToUpload[index] }))
        .filter((entry): entry is { result: PromiseRejectedResult, file: File } => entry.result.status === 'rejected')

      selectedFiles.value = failures.map(entry => entry.file)

      if (failures.length) {
        showError(
          failures.length === filesToUpload.length ? 'Enregistrement impossible' : 'Ajout partiellement réussi',
          failures[0]?.result.reason,
          `${failures.length} fichier(s) sur ${filesToUpload.length} n'ont pas pu être ajoutés.`
        )
      }

      if (failures.length < filesToUpload.length) emit('saved')
      if (failures.length) return
    } else {
      await $fetch('/api/deliverables', {
        method: 'POST',
        body: {
          type: selectedType.value,
          projectId: props.projectId,
          name: name.value.trim(),
          description: description.value.trim(),
          ...(selectedType.value === 'link' ? { url: url.value.trim() } : { content: content.value })
        }
      })
    }

    emit('saved')
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du livrable:', error)
    showError(
      'Enregistrement impossible',
      error,
      isEditing.value ? 'Impossible de mettre à jour le livrable.' : 'Impossible d\'ajouter le livrable.'
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
    :aria-describedby="isEditing ? 'Modifier les informations du livrable' : 'Ajouter un document, un lien ou une note au projet'"
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
      <UForm
        :state="formState"
        :schema="schema"
        class="space-y-5"
        @submit="onSubmit"
      >
        <div class="space-y-2.5">
          <p class="text-sm font-medium text-slate-700">
            Type de livrable
          </p>
          <AttachmentTypeSelector
            v-model="selectedType"
            :options="typeOptions"
            :locked="isEditing"
          />
        </div>

        <UFormField
          v-if="!isMultipleFiles"
          label="Nom"
          name="name"
          required
        >
          <UInput
            v-model="name"
            placeholder="Ex: Maquette page d'accueil"
            class="w-full"
          />
        </UFormField>
        <p
          v-else
          class="text-xs text-slate-500"
        >
          Chaque fichier sera ajouté comme un livrable distinct, nommé d'après son nom de fichier.
        </p>

        <div
          v-if="selectedType === 'document'"
          class="space-y-3"
        >
          <label class="text-sm font-medium text-slate-700">
            Fichier(s)
          </label>
          <AttachmentFileInput
            v-model="selectedFiles"
            :accept="deliverableFileInputAccept"
            :max-size-bytes="deliverableMaxSizeBytes"
            :max-size-label="maxFileSizeLabel"
            :locked="isEditing"
            :locked-filename="deliverable?.filename"
            :locked-file-size="deliverable?.size"
          />
        </div>

        <UFormField
          v-else-if="selectedType === 'link'"
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
          v-else
          label="Texte"
          name="content"
          required
        >
          <UTextarea
            v-model="content"
            :rows="6"
            class="w-full"
            placeholder="Rédigez votre note ici..."
          />
        </UFormField>

        <UFormField
          v-if="selectedType !== 'text' || description.trim()"
          label="Description"
          name="description"
        >
          <UInput
            v-model="description"
            placeholder="Décris brièvement le livrable si nécessaire."
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
      </UForm>
    </template>
  </UModal>
</template>
