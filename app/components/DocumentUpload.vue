<script setup lang="ts">
import { documentAcceptedMimeTypes, documentFileInputAccept, documentMaxSizeBytes } from '~/validation/documents'
import { formatFileSize, formatDate } from '~/lib/utils'

interface Document {
  id: number
  name: string
  filename: string
  filepath: string
  downloadUrl?: string | null
  mimetype: string
  size: number
  entityType: string
  entityId: number
  documentType?: string | null
  description?: string | null
  createdAt: string | Date
}

const props = defineProps<{
  entityType: 'quote' | 'invoice' | 'project' | 'client' | 'task'
  entityId: number
  documentType?: 'quote' | 'invoice'
  title?: string
  emptyMessage?: string
  uploadLabel?: string
  documents?: Document[]
}>()

const emit = defineEmits<{
  uploaded: []
  deleted: [documentId: number]
}>()

const toast = useToast()
const isUploading = ref(false)
const selectedFile = ref<File | null>(null)
const description = ref('')

const fileInput = ref<HTMLInputElement>()

const allowedDocumentTypesLabel = 'PDF'

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
  if (target.files && target.files.length > 0) {
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
}

const maxFileSizeLabel = formatFileSize(documentMaxSizeBytes)

const getDownloadHref = (document: Document) => {
  if (document.downloadUrl) return document.downloadUrl
  return document.filepath.startsWith('http') ? document.filepath : undefined
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

  isUploading.value = true
  try {
    const formData = new FormData()
    formData.set('file', selectedFile.value)
    formData.set('entityType', props.entityType)
    formData.set('entityId', String(props.entityId))
    if (props.documentType) {
      formData.set('documentType', props.documentType)
    }
    formData.set('name', selectedFile.value.name)
    formData.set('description', description.value.trim())

    await $fetch('/api/documents', { method: 'POST', body: formData })

    clearSelectedFile()
    description.value = ''

    emit('uploaded')
    toast.add({
      title: 'Document téléversé',
      description: 'Le document est disponible au téléchargement.',
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

const onDelete = async (documentId: number) => {
  try {
    await $fetch(`/api/documents/${documentId}`, { method: 'DELETE' })
    emit('deleted', documentId)
    toast.add({
      title: 'Document supprimé',
      description: 'Le document a été supprimé avec succès.',
      color: 'primary',
      icon: 'i-lucide-check-circle'
    })
  } catch (error) {
    toast.add({
      title: 'Échec de la suppression',
      description: getErrorMessage(error, 'Impossible de supprimer le document.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  }
}

const getFileIcon = (mimetype: string) => {
  if (mimetype.includes('pdf')) return 'i-lucide-file-text'
  if (mimetype.includes('image')) return 'i-lucide-image'
  if (mimetype.includes('word') || mimetype.includes('document')) return 'i-lucide-file-text'
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'i-lucide-file-spreadsheet'
  return 'i-lucide-file'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Upload Section -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-upload" />
          {{ title || 'Ajouter un document' }}
        </h3>
      </template>

      <div class="space-y-4">
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
          <p
            v-if="selectedFile"
            class="mt-2 text-sm text-gray-600"
          >
            Fichier sélectionné: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
          </p>
        </div>

        <UFormField
          label="Description (optionnel)"
          name="description"
        >
          <UInput
            v-model="description"
            placeholder="Description du document..."
          />
        </UFormField>

        <div class="flex justify-end">
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
    </UCard>

    <!-- Documents List -->
    <div v-if="documents && documents.length > 0">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <UIcon name="i-lucide-files" />
        Documents ({{ documents.length }})
      </h3>

      <div class="space-y-2">
        <UCard
          v-for="doc in documents"
          :key="doc.id"
          variant="soft"
          class="hover:bg-elevated transition-all duration-200"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 flex-1">
              <UIcon
                :name="getFileIcon(doc.mimetype)"
                class="text-2xl text-primary-600"
              />
              <div class="flex-1">
                <h4 class="font-semibold">
                  {{ doc.name }}
                </h4>
                <p class="text-sm text-gray-600">
                  {{ doc.filename }} • {{ formatFileSize(doc.size) }}
                </p>
                <p
                  v-if="doc.description"
                  class="text-sm text-gray-500 mt-1"
                >
                  {{ doc.description }}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  Ajouté le {{ formatDate(doc.createdAt) }}
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <UButton
                size="sm"
                variant="soft"
                color="primary"
                icon="i-lucide-download"
                :href="getDownloadHref(doc)"
                :disabled="!getDownloadHref(doc)"
                target="_blank"
                rel="noopener noreferrer"
              >
                Télécharger
              </UButton>
              <UButton
                size="sm"
                variant="soft"
                color="error"
                icon="i-lucide-trash"
                aria-label="Supprimer le document"
                @click="onDelete(doc.id)"
              />
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <div
      v-else
      class="text-center py-8 text-gray-500"
    >
      <UIcon
        name="i-lucide-file-x"
        class="text-4xl mb-2"
      />
      <p>Aucun document</p>
      <p
        v-if="emptyMessage"
        class="mt-1"
      >
        {{ emptyMessage }}
      </p>
    </div>
  </div>
</template>
