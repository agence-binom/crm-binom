<script setup lang="ts">
import { formatDate, formatFileSize, getErrorMessage } from '~/lib/utils'
import type { ProjectDocument } from '~/types'

const toast = useToast()

defineProps<{
  document: ProjectDocument
}>()

const emit = defineEmits<{
  'delete-document': [documentId: number]
}>()

const getDocumentTypeLabel = (documentType?: ProjectDocument['documentType']) => {
  return documentType === 'invoice' ? 'Facture' : 'Devis'
}

const getDocumentTypeColor = (documentType?: ProjectDocument['documentType']): 'primary' | 'success' => {
  return documentType === 'invoice' ? 'success' : 'primary'
}

const getDownloadHref = (document: ProjectDocument) => {
  if (document.downloadUrl) return document.downloadUrl
  return document.filepath.startsWith('http') ? document.filepath : undefined
}

const getFactureNetHref = (document: ProjectDocument) => {
  if (!document.externalUrl) return undefined
  return document.externalUrl.startsWith('http') ? document.externalUrl : undefined
}

const getFileIcon = (mimetype: string) => {
  if (mimetype.includes('pdf')) return 'i-lucide-file-text'
  if (mimetype.includes('image')) return 'i-lucide-image'
  if (mimetype.includes('word') || mimetype.includes('document')) return 'i-lucide-file-text'
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'i-lucide-file-spreadsheet'
  return 'i-lucide-file'
}

const onDeleteDocument = async (documentId: number) => {
  try {
    await $fetch(`/api/documents/${documentId}`, { method: 'DELETE' })
    await emit('delete-document', documentId)
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
</script>

<template>
  <div class="flex min-w-0 flex-1 items-start gap-3">
    <div class="rounded-lg bg-primary-50 p-2 text-primary-600">
      <UIcon
        :name="getFileIcon(document.mimetype)"
        class="text-lg"
      />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <p class="truncate font-medium">
          {{ document.name }}
        </p>
        <UBadge
          variant="soft"
          :color="getDocumentTypeColor(document.documentType)"
        >
          {{ getDocumentTypeLabel(document.documentType) }}
        </UBadge>
        <UBadge
          v-if="!getFactureNetHref(document)"
          variant="soft"
          color="warning"
        >
          Lien Facture.net manquant
        </UBadge>
      </div>

      <p class="mt-1 text-sm text-gray-600">
        {{ document.filename }} • {{ formatFileSize(document.size) }}
      </p>

      <p
        v-if="document.description"
        class="mt-1 text-sm text-gray-500"
      >
        {{ document.description }}
      </p>

      <p class="mt-1 text-xs text-gray-400">
        Ajouté le {{ formatDate(document.createdAt) }}
      </p>
    </div>
  </div>

  <div class="flex shrink-0 items-center gap-2">
    <UButton
      size="sm"
      variant="soft"
      color="neutral"
      icon="i-lucide-external-link"
      :href="getFactureNetHref(document)"
      :disabled="!getFactureNetHref(document)"
      target="_blank"
      rel="noopener noreferrer"
    >
      Voir sur Facture.net
    </UButton>
    <UButton
      size="sm"
      variant="soft"
      color="primary"
      icon="i-lucide-download"
      :href="getDownloadHref(document)"
      :disabled="!getDownloadHref(document)"
      target="_blank"
      rel="noopener noreferrer"
    >
      Télécharger
    </UButton>
    <UButton
      size="sm"
      variant="soft"
      color="error"
      icon="i-lucide-trash-2"
      aria-label="Supprimer le document"
      @click="onDeleteDocument(document.id)"
    />
  </div>
</template>
