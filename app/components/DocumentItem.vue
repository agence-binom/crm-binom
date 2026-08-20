<script setup lang="ts">
import { formatDate, formatFileSize, getErrorMessage, getFileTypeIcon } from '~/lib/utils'
import { documentStatusLabels, type BillingDocumentType, type DocumentStatus } from '~/lib/documents'
import { documentStatuses } from '~/validation/documents'
import type { ProjectDocument } from '~/types'

const toast = useToast()

const props = defineProps<{
  document: ProjectDocument
}>()

const emit = defineEmits<{
  'delete-document': [documentId: number]
  'update-document': []
}>()

const isBillingDocumentType = (documentType?: string | null): documentType is BillingDocumentType =>
  documentType === 'quote' || documentType === 'invoice' || documentType === 'commercial_proposal'

const statusOptions = computed(() => {
  if (!isBillingDocumentType(props.document.documentType)) return []

  const labels = documentStatusLabels[props.document.documentType]
  return documentStatuses.map(status => ({ label: labels[status], value: status }))
})

const isUpdatingStatus = ref(false)

const onStatusChange = async (status: DocumentStatus) => {
  if (status === props.document.status) return

  isUpdatingStatus.value = true

  try {
    await $fetch(`/api/documents/${props.document.id}`, {
      method: 'PUT',
      body: { status }
    })
    emit('update-document')
  } catch (error) {
    toast.add({
      title: 'Échec de la mise à jour',
      description: getErrorMessage(error, 'Impossible de mettre à jour le statut du document.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isUpdatingStatus.value = false
  }
}

const getDownloadHref = (document: ProjectDocument) => {
  if (document.downloadUrl) return document.downloadUrl
  return document.filepath.startsWith('http') ? document.filepath : undefined
}

const getFactureNetHref = (document: ProjectDocument) => {
  if (!document.externalUrl) return undefined
  return document.externalUrl.startsWith('http') ? document.externalUrl : undefined
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
        :name="getFileTypeIcon(document.mimetype)"
        class="text-lg"
      />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <p class="truncate font-medium">
          {{ document.name }}
        </p>
        <USelect
          v-if="statusOptions.length > 0"
          :model-value="document.status"
          :items="statusOptions"
          :loading="isUpdatingStatus"
          size="sm"
          class="w-32"
          @update:model-value="onStatusChange"
        />
        <UBadge
          v-if="!getFactureNetHref(document) && (document.documentType === 'quote' || document.documentType === 'invoice')"
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

  <div class="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
    <UButton
      v-if="document.documentType === 'quote' || document.documentType === 'invoice'"
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
