<script setup lang="ts">
import { resourceTypes, type ResourceType } from '~/constants/resources'
import { getResourceTypeIcon, getResourceTypeLabel } from '~/lib/resources'
import { formatFileSize } from '~/lib/utils'
import { resourceFileInputAccept, resourceMaxSizeBytes } from '~/validation/resources'
import type { ProjectResource } from '~/types'

const props = defineProps<{
  open: boolean
  projectId: number
  resource?: ProjectResource | null
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
const isEditing = computed(() => Boolean(props.resource))

const modalTitle = computed(() => (isEditing.value ? 'Modifier la ressource' : 'Nouvelle ressource'))
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : 'Créer la ressource'))

const selectedType = ref<ResourceType>('document')
const name = ref('')
const description = ref('')
const url = ref('')
const content = ref('')
const selectedFile = ref<File | null>(null)

const typeOptions = resourceTypes.map(type => ({
  label: getResourceTypeLabel(type),
  value: type,
  icon: getResourceTypeIcon(type)
}))

const maxFileSizeLabel = formatFileSize(resourceMaxSizeBytes)

const resetForm = () => {
  selectedType.value = 'document'
  name.value = ''
  description.value = ''
  url.value = ''
  content.value = ''
  selectedFile.value = null
}

const fillFromResource = (resource: ProjectResource) => {
  selectedType.value = resource.type
  name.value = resource.name ?? ''
  description.value = resource.description ?? ''
  url.value = resource.type === 'link' ? (resource.url ?? '') : ''
  content.value = resource.type === 'text' ? (resource.content ?? '') : ''
  selectedFile.value = null
}

watch(
  () => [props.open, props.resource] as const,
  ([open, resource]) => {
    if (!open) return
    if (resource) fillFromResource(resource)
    else resetForm()
  }
)

const isValid = computed(() => {
  if (!name.value.trim()) return false
  if (selectedType.value === 'document') return isEditing.value || Boolean(selectedFile.value)
  if (selectedType.value === 'link') return Boolean(url.value.trim())
  return Boolean(content.value.trim())
})

const onSubmit = async () => {
  if (!isValid.value) return

  isSaving.value = true

  try {
    if (isEditing.value) {
      if (!props.resource) throw new Error('resource manquante pour la mise à jour')

      await $fetch(`/api/resources/${props.resource.id}`, {
        method: 'PUT',
        body: {
          name: name.value.trim(),
          description: description.value.trim(),
          ...(selectedType.value === 'link' ? { url: url.value.trim() } : {}),
          ...(selectedType.value === 'text' ? { content: content.value } : {})
        }
      })
    } else if (selectedType.value === 'document') {
      const formData = new FormData()
      formData.set('file', selectedFile.value as File)
      formData.set('projectId', String(props.projectId))
      formData.set('name', name.value.trim())
      formData.set('description', description.value.trim())

      await $fetch('/api/resources/upload', { method: 'POST', body: formData })
    } else {
      await $fetch('/api/resources', {
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
    console.error('Erreur lors de la sauvegarde de la ressource:', error)
    showError(
      'Enregistrement impossible',
      error,
      isEditing.value ? 'Impossible de mettre à jour la ressource.' : 'Impossible d\'ajouter la ressource.'
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
    :aria-describedby="isEditing ? 'Modifier les informations de la ressource' : 'Ajouter un document, un lien ou une note au projet'"
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
      <div class="space-y-5">
        <div class="space-y-2.5">
          <p class="text-sm font-medium text-slate-700">
            Type de ressource
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
            :accept="resourceFileInputAccept"
            :max-size-bytes="resourceMaxSizeBytes"
            :max-size-label="maxFileSizeLabel"
            :locked="isEditing"
            :locked-filename="resource?.filename"
            :locked-file-size="resource?.size"
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
          label="Description"
          name="description"
        >
          <UInput
            v-model="description"
            placeholder="Décris brièvement la ressource si nécessaire."
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
