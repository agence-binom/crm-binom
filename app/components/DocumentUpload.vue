<script setup lang="ts">
interface Document {
  id: number
  name: string
  filename: string
  filepath: string
  mimetype: string
  size: number
  entityType: string
  entityId: number
  description?: string | null
  createdAt: string | Date
}

const props = defineProps<{
  entityType: 'quote' | 'invoice' | 'project' | 'client' | 'task'
  entityId: number
  documents?: Document[]
}>()

const emit = defineEmits<{
  uploaded: []
  deleted: [documentId: number]
}>()

const isUploading = ref(false)
const selectedFile = ref<File | null>(null)
const description = ref('')

const fileInput = ref<HTMLInputElement>()

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0] || null
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const onUpload = async () => {
  if (!selectedFile.value) return

  isUploading.value = true
  try {
    // Note: Dans une vraie implémentation, il faudrait gérer l'upload du fichier
    // vers un service de stockage (S3, etc.) et récupérer le chemin
    // Pour l'instant, on simule juste la création de l'enregistrement en base

    const body = {
      name: description.value || selectedFile.value.name,
      filename: selectedFile.value.name,
      filepath: `/uploads/${props.entityType}/${props.entityId}/${selectedFile.value.name}`, // Chemin simulé
      mimetype: selectedFile.value.type,
      size: selectedFile.value.size,
      entityType: props.entityType,
      entityId: props.entityId,
      description: description.value
    }

    await $fetch('/api/documents', { method: 'POST', body })

    selectedFile.value = null
    description.value = ''
    if (fileInput.value) fileInput.value.value = ''

    emit('uploaded')
  } catch (error) {
    console.error('Erreur lors de l\'upload du document:', error)
  } finally {
    isUploading.value = false
  }
}

const onDelete = async (documentId: number) => {
  try {
    await $fetch(`/api/documents/${documentId}`, { method: 'DELETE' })
    emit('deleted', documentId)
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error)
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
          Ajouter un document
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
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            @change="onFileSelected"
          >
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
            Téléverser
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
                :href="doc.filepath"
                target="_blank"
              >
                Télécharger
              </UButton>
              <UButton
                size="sm"
                variant="soft"
                color="error"
                icon="i-lucide-trash"
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
    </div>
  </div>
</template>
