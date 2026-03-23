<script setup lang="ts">
import { type billingDocumentTypes, documentAcceptedMimeTypes, documentFileInputAccept, documentMaxSizeBytes, isFactureNetUrl } from '~/validation/documents'
import { formatFileSize } from '~/lib/utils'

type BillingDocumentType = typeof billingDocumentTypes[number]

const props = defineProps<{
  open: boolean
  entityType: 'quote' | 'invoice' | 'project' | 'client' | 'task'
  entityId: number
  documentType?: BillingDocumentType
  title?: string
  uploadLabel?: string
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'uploaded': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const toast = useToast()
const isUploading = ref(false)
const selectedFile = ref<File | null>(null)
const description = ref('')
const externalUrl = ref('')
const selectedDocumentType = ref<BillingDocumentType>(props.documentType ?? 'quote')
const fileInput = ref<HTMLInputElement>()

const modalTitle = computed(() => props.title || 'Ajouter un document')
const allowedDocumentTypesLabel = 'PDF'
const maxFileSizeLabel = formatFileSize(documentMaxSizeBytes)
const currentDocumentType = computed(() => props.documentType ?? selectedDocumentType.value)
const requiresFactureNetLink = computed(() => currentDocumentType.value === 'quote' || currentDocumentType.value === 'invoice')

const documentTypeOptions = [
  { label: 'Devis', value: 'quote' },
  { label: 'Facture', value: 'invoice' }
] satisfies { label: string, value: BillingDocumentType }[]

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const maybeStatusMessage = Reflect.get(error, 'statusMessage')
    if (typeof maybeStatusMessage === 'string' && maybeStatusMessage) {
      return maybeStatusMessage
    }

    const maybeData = Reflect.get(error, 'data')
    if (maybeData && typeof maybeData === 'object') {
      const dataStatusMessage = Reflect.get(maybeData, 'statusMessage')
      if (typeof dataStatusMessage === 'string' && dataStatusMessage) {
        return dataStatusMessage
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

const clearSelectedFile = () => {
  selectedFile.value = null

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const resetForm = () => {
  clearSelectedFile()
  description.value = ''
  externalUrl.value = ''
  selectedDocumentType.value = props.documentType ?? 'quote'
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetForm()
    }
  }
)

watch(
  () => props.documentType,
  (documentType) => {
    selectedDocumentType.value = documentType ?? 'quote'
  }
)

const validateSelectedFile = (file: File) => {
  if (!documentAcceptedMimeTypes.includes(file.type as typeof documentAcceptedMimeTypes[number])) {
    return `Format non pris en charge. Formats acceptés: ${allowedDocumentTypesLabel}.`
  }

  if (file.size > documentMaxSizeBytes) {
    return 'Le fichier dépasse la taille maximale autorisée de 10 Mo.'
  }

  return null
}

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) {
    clearSelectedFile()
    return
  }

  const file = target.files[0] || null
  if (!file) {
    clearSelectedFile()
    return
  }

  const validationError = validateSelectedFile(file)
  if (validationError) {
    clearSelectedFile()
    toast.add({
      title: 'Fichier refusé',
      description: validationError,
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
    return
  }

  selectedFile.value = file
}

const validateExternalUrl = (value: string) => {
  const normalizedValue = value.trim()

  if (!requiresFactureNetLink.value) {
    return null
  }

  if (!normalizedValue) {
    return 'Le lien Facture.net est requis pour un devis ou une facture.'
  }

  if (!isFactureNetUrl(normalizedValue)) {
    return 'Le lien doit pointer vers une page Facture.net valide.'
  }

  return null
}

const onUpload = async () => {
  if (!selectedFile.value) return

  const validationError = validateSelectedFile(selectedFile.value)
  if (validationError) {
    toast.add({
      title: 'Fichier refusé',
      description: validationError,
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
    return
  }

  const externalUrlError = validateExternalUrl(externalUrl.value)
  if (externalUrlError) {
    toast.add({
      title: 'Lien Facture.net invalide',
      description: externalUrlError,
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
    return
  }

  isUploading.value = true

  try {
    const formData = new FormData()
    formData.set('file', selectedFile.value)
    formData.set('entityType', props.entityType)
    formData.set('entityId', String(props.entityId))
    formData.set('documentType', props.documentType ?? selectedDocumentType.value)
    formData.set('externalUrl', externalUrl.value.trim())
    formData.set('name', selectedFile.value.name)
    formData.set('description', description.value.trim())

    await $fetch('/api/documents', { method: 'POST', body: formData })

    emit('uploaded')
    isOpen.value = false
    resetForm()

    toast.add({
      title: 'Document téléversé',
      description: 'Le PDF et le lien Facture.net sont maintenant rattachés au document.',
      color: 'primary',
      icon: 'i-lucide-check-circle'
    })
  } catch (error) {
    toast.add({
      title: 'Échec du téléversement',
      description: getErrorMessage(error, 'Impossible de téléverser le document.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    aria-describedby="Téléverser un document"
    :close="{
      color: 'error',
      variant: 'solid',
      icon: 'i-lucide-x',
      size: 'xs',
      label: 'Fermer'
    }"
    class="w-full max-w-2xl"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField
          v-if="!props.documentType"
          label="Type de document"
          name="documentType"
          required
        >
          <USelect
            v-model="selectedDocumentType"
            :items="documentTypeOptions"
            value-attribute="value"
            option-attribute="label"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="currentDocumentType"
          label="Lien Facture.net"
          name="externalUrl"
          :required="requiresFactureNetLink"
        >
          <UInput
            v-model="externalUrl"
            type="url"
            placeholder="https://www.facture.net/..."
            class="w-full"
          />
          <p class="mt-2 text-xs text-gray-500">
            Collez l'URL de la page dédiée au devis ou à la facture dans Facture.net.
          </p>
        </UFormField>

        <div>
          <label class="block text-sm font-medium mb-2">
            Fichier
          </label>
          <input
            ref="fileInput"
            type="file"
            :accept="documentFileInputAccept"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            @change="onFileSelected"
          >
          <p class="mt-2 text-xs text-gray-500">
            Formats acceptés: {{ allowedDocumentTypesLabel }}. Taille maximale: {{ maxFileSizeLabel }}.
          </p>
        </div>

        <UFormField
          label="Description (optionnel)"
          name="description"
        >
          <UInput
            v-model="description"
            placeholder="Description du document..."
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="soft"
            :disabled="isUploading"
            @click="isOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            :disabled="!selectedFile || isUploading"
            :loading="isUploading"
            icon="i-lucide-upload"
            @click="onUpload"
          >
            {{ uploadLabel || 'Téléverser' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
