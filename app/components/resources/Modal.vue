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

const toast = useToast()
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
const fileInput = ref<HTMLInputElement>()

const typeOptions = resourceTypes.map(type => ({
  label: getResourceTypeLabel(type),
  value: type,
  icon: getResourceTypeIcon(type)
}))

const maxFileSizeLabel = formatFileSize(resourceMaxSizeBytes)

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
  content.value = ''
  clearSelectedFile()
}

const fillFromResource = (resource: ProjectResource) => {
  selectedType.value = resource.type
  name.value = resource.name ?? ''
  description.value = resource.description ?? ''
  url.value = resource.type === 'link' ? (resource.url ?? '') : ''
  content.value = resource.type === 'text' ? (resource.content ?? '') : ''
  clearSelectedFile()
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    if (isEditing.value && props.resource) fillFromResource(props.resource)
    else resetForm()
  }
)

watch(
  () => props.resource,
  (resource) => {
    if (!props.open) return
    if (isEditing.value && resource) fillFromResource(resource)
  }
)

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null

  if (!file) {
    clearSelectedFile()
    return
  }

  if (file.size > resourceMaxSizeBytes) {
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
          <div
            v-if="isEditing"
            class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
          >
            <UIcon :name="getResourceTypeIcon(selectedType)" />
            {{ getResourceTypeLabel(selectedType) }}
          </div>
          <div
            v-else
            class="flex flex-wrap gap-2"
          >
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
          <div
            v-if="isEditing"
            class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
          >
            {{ resource?.filename }} • {{ formatFileSize(resource?.size || 0) }}
            <p class="mt-1 text-xs text-slate-400">
              Le fichier ne peut pas être modifié après l'ajout.
            </p>
          </div>
          <div
            v-else
            class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4"
          >
            <input
              ref="fileInput"
              type="file"
              :accept="resourceFileInputAccept"
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
