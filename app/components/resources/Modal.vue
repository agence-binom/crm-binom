<script setup lang="ts">
import { resourceCreateFormSchema, resourceEditFormSchema, resourceFileInputAccept, resourceMaxSizeBytes } from '~/validation/resources'
import { resourceTypes, type ResourceType } from '~/constants/resources'
import { getResourceTypeIcon, getResourceTypeLabel } from '~/lib/resources'
import { formatFileSize } from '~/lib/utils'
import type { ProjectResource } from '~/types'

// Modal partagé par l'app agence et le portail client : les deux routes exposent la même forme
// (POST `base`, PUT `base/:id`, POST `base/upload`), seule la base change. La frontière staff /
// client reste côté serveur (`server/middleware/01-auth.ts`) - `apiBase` ne choisit qu'une URL,
// il n'accorde aucun droit : un contact portail qui viserait /api/resources se prend un 401.
const props = withDefaults(defineProps<{
  open: boolean
  projectId: number
  resource?: ProjectResource | null
  apiBase?: '/api/resources' | '/api/portal/resources'
  createLabel?: string
}>(), {
  resource: null,
  apiBase: '/api/resources',
  createLabel: 'Créer la ressource'
})

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

// formState est bindé directement par les inputs ci-dessous, donc UForm valide bien ce qui est
// soumis (et Entrée soumet le formulaire).
const schema = computed(() => (isEditing.value ? resourceEditFormSchema : resourceCreateFormSchema))
const modalTitle = computed(() => (isEditing.value ? 'Modifier la ressource' : 'Nouvelle ressource'))
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : props.createLabel))

const createInitialFormState = () => ({
  type: 'document' as ResourceType,
  projectId: props.projectId,
  name: '',
  description: '',
  url: '',
  content: ''
})

const formState = reactive(createInitialFormState())
const selectedFiles = ref<File[]>([])

const typeOptions = resourceTypes.map(type => ({
  label: getResourceTypeLabel(type),
  value: type,
  icon: getResourceTypeIcon(type)
}))

const maxFileSizeLabel = formatFileSize(resourceMaxSizeBytes)

const resetForm = () => {
  Object.assign(formState, createInitialFormState())
  selectedFiles.value = []
}

const fillFromResource = (resource: ProjectResource) => {
  formState.type = resource.type
  formState.name = resource.name ?? ''
  formState.description = resource.description ?? ''
  formState.url = resource.type === 'link' ? (resource.url ?? '') : ''
  formState.content = resource.type === 'text' ? (resource.content ?? '') : ''
  selectedFiles.value = []
}

watch(
  () => [props.open, props.resource] as const,
  ([open, resource]) => {
    if (!open) return
    if (resource) fillFromResource(resource)
    else resetForm()
  }
)

const isMultipleFiles = computed(() => selectedFiles.value.length > 1)

// Un document créé sans nom reprend celui de son fichier (createResourceInsertValues, partagé par
// les deux routes d'upload) : l'afficher en placeholder rend ce repli visible avant validation.
const namePlaceholder = computed(() => (formState.type === 'document' && selectedFiles.value[0]?.name) || 'Ex: Cahier des charges')

const isValid = computed(() => {
  if (formState.type === 'document') {
    if (isEditing.value) return Boolean(formState.name.trim())
    return selectedFiles.value.length > 0
  }
  if (!formState.name.trim()) return false
  if (formState.type === 'link') return Boolean(formState.url.trim())
  return Boolean(formState.content.trim())
})

const uploadDocuments = async () => {
  const filesToUpload = selectedFiles.value
  const sharedName = isMultipleFiles.value ? '' : formState.name.trim()
  const sharedDescription = formState.description.trim()

  const results = await Promise.allSettled(filesToUpload.map((file) => {
    const uploadFormData = new FormData()
    uploadFormData.set('file', file)
    uploadFormData.set('projectId', String(props.projectId))
    uploadFormData.set('name', sharedName)
    uploadFormData.set('description', sharedDescription)

    return $fetch(`${props.apiBase}/upload`, { method: 'POST', body: uploadFormData })
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

    // Un succès partiel rafraîchit la liste mais garde le modal ouvert pour réessayer les fichiers
    // en échec ; seul un succès complet tombe dans le emit+fermeture partagé en bas de onSubmit,
    // si bien que `saved` n'est jamais émis deux fois.
    if (failures.length < filesToUpload.length) emit('saved')
    return false
  }

  return true
}

const onSubmit = async () => {
  if (!isValid.value) return

  isSaving.value = true

  try {
    if (isEditing.value) {
      if (!props.resource) throw new Error('resource manquante pour la mise à jour')

      await $fetch(`${props.apiBase}/${props.resource.id}`, {
        method: 'PUT',
        body: {
          name: formState.name.trim(),
          description: formState.description.trim(),
          ...(formState.type === 'link' ? { url: formState.url.trim() } : {}),
          ...(formState.type === 'text' ? { content: formState.content } : {})
        }
      })
    } else if (formState.type === 'document') {
      const uploadedAll = await uploadDocuments()
      if (!uploadedAll) return
    } else {
      await $fetch(props.apiBase, {
        method: 'POST',
        body: {
          type: formState.type,
          projectId: props.projectId,
          name: formState.name.trim(),
          description: formState.description.trim(),
          ...(formState.type === 'link' ? { url: formState.url.trim() } : { content: formState.content })
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
      <UForm
        :state="formState"
        :schema="schema"
        class="space-y-5"
        @submit="onSubmit"
      >
        <div class="space-y-2.5">
          <p class="text-sm font-medium text-slate-700">
            Type de ressource
          </p>
          <AttachmentTypeSelector
            v-model="formState.type"
            :options="typeOptions"
            :locked="isEditing"
          />
        </div>

        <UFormField
          v-if="!isMultipleFiles"
          label="Nom"
          name="name"
          :required="isEditing || formState.type !== 'document'"
        >
          <UInput
            v-model="formState.name"
            :placeholder="namePlaceholder"
          />
        </UFormField>
        <p
          v-else
          class="text-xs text-slate-500"
        >
          Chaque fichier sera ajouté comme une ressource distincte, nommée d'après son nom de fichier.
        </p>

        <div
          v-if="formState.type === 'document'"
          class="space-y-3"
        >
          <label class="text-sm font-medium text-slate-700">
            Fichier(s)
          </label>
          <AttachmentFileInput
            v-model="selectedFiles"
            :accept="resourceFileInputAccept"
            :max-size-bytes="resourceMaxSizeBytes"
            :max-size-label="maxFileSizeLabel"
            :locked="isEditing"
            :locked-filename="resource?.filename"
            :locked-file-size="resource?.size"
          />
        </div>

        <UFormField
          v-else-if="formState.type === 'link'"
          label="Lien"
          name="url"
          required
        >
          <UInput
            v-model="formState.url"
            type="url"
            placeholder="https://..."
          />
        </UFormField>

        <UFormField
          v-else
          label="Texte"
          name="content"
          required
        >
          <UTextarea
            v-model="formState.content"
            :rows="6"
            placeholder="Rédigez votre note ici..."
          />
        </UFormField>

        <UFormField
          v-if="formState.type !== 'text' || formState.description.trim()"
          label="Description"
          name="description"
        >
          <UInput
            v-model="formState.description"
            placeholder="Décris brièvement la ressource si nécessaire."
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
