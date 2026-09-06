<script setup lang="ts">
import { z } from 'zod'
import { resourceCreateSchema, resourceFileInputAccept, resourceMaxSizeBytes } from '~/validation/resources'
import { resourceTypes, type ResourceType } from '~/constants/resources'
import { getResourceTypeIcon, getResourceTypeLabel } from '~/lib/resources'
import { formatFileSize } from '~/lib/utils'
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
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : 'Ajouter la ressource'))

// Bound directly by the inputs below (unlike the admin ResourcesModal's formState, which only
// mirrors separate refs) so UForm validates what's actually submitted and Enter-to-submit works.
// `resourceCreateSchema` only covers link/text - its branches are reused as-is here (so this stays
// in sync with the server's validation, e.g. the http(s)-only URL check) and extended with a
// lenient 'document' branch to match the full ResourceType. That branch stays lenient on purpose:
// `name` can be blank when multiple files are selected (each resource is then named after its
// file), and file presence is a File[] concern `isValid` handles separately.
//
// Editing needs its own discriminated union rather than `resourceUpdateSchema` applied to the
// whole formState: formState always carries both `url` and `content` regardless of the resource's
// type, and resourceUpdateSchema validates whichever of those is present - so the field hidden by
// the current type (e.g. `url: ''` while editing a note) fails validation even though it's never
// submitted. Keying on `type` like the create branches means only the relevant field is checked.
const [linkCreateSchema, textCreateSchema] = resourceCreateSchema.options

const resourceFormSchema = computed(() => (isEditing.value
  ? z.discriminatedUnion('type', [
      z.object({
        type: z.literal('document'),
        name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long'),
        description: z.string().optional().or(z.literal(''))
      }),
      linkCreateSchema.omit({ projectId: true }),
      textCreateSchema.omit({ projectId: true })
    ])
  : z.discriminatedUnion('type', [
      z.object({
        type: z.literal('document'),
        projectId: z.number().int().positive(),
        name: z.string().max(255, 'Le nom est trop long').optional().or(z.literal('')),
        description: z.string().optional().or(z.literal(''))
      }),
      ...resourceCreateSchema.options
    ])))

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

const isValid = computed(() => {
  if (isEditing.value) return Boolean(formState.name.trim())
  if (formState.type === 'document') {
    return selectedFiles.value.length > 0 && (isMultipleFiles.value || Boolean(formState.name.trim()))
  }
  if (!formState.name.trim()) return false
  if (formState.type === 'link') return Boolean(formState.url.trim())
  return Boolean(formState.content.trim())
})

const uploadDocuments = async () => {
  const filesToUpload = selectedFiles.value
  const sharedName = isMultipleFiles.value ? '' : formState.name.trim()

  const results = await Promise.allSettled(filesToUpload.map((file) => {
    const uploadFormData = new FormData()
    uploadFormData.set('file', file)
    uploadFormData.set('projectId', String(props.projectId))
    uploadFormData.set('name', sharedName)
    uploadFormData.set('description', formState.description.trim())

    return $fetch('/api/portal/resources/upload', { method: 'POST', body: uploadFormData })
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

  // A total failure leaves nothing to refresh and the modal open to retry; a partial success still
  // needs the list refreshed but also stays open so the failed files can be retried - only a clean
  // sweep falls through to the shared close+refresh in onSubmit, so `saved` is only ever emitted once.
  if (failures.length > 0 && failures.length < filesToUpload.length) emit('saved')
  return failures.length === 0
}

const onSubmit = async () => {
  if (!isValid.value) return

  isSaving.value = true

  try {
    if (isEditing.value) {
      if (!props.resource) throw new Error('resource manquante pour la mise à jour')

      await $fetch(`/api/portal/resources/${props.resource.id}`, {
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
      await $fetch('/api/portal/resources', {
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
        :schema="resourceFormSchema"
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
            placeholder="Ex: Cahier des charges"
            class="w-full"
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
            v-model="formState.content"
            :rows="6"
            class="w-full"
            placeholder="Rédigez votre note ici..."
          />
        </UFormField>

        <UFormField
          v-if="formState.type !== 'text'"
          label="Description"
          name="description"
        >
          <UInput
            v-model="formState.description"
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
      </UForm>
    </template>
  </UModal>
</template>
