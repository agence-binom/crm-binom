<script setup lang="ts">
import { formatFileSize, getErrorMessage, getFileTypeIcon } from '~/lib/utils'
import { documentStatusLabels, getDocumentDownloadHref, getDocumentFactureNetHref, type BillingDocumentType, type DocumentStatus } from '~/lib/documents'
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
</script>

<template>
  <AppAttachmentMeta
    :icon="getFileTypeIcon(document.mimetype)"
    :description="document.description"
    :created-at="document.createdAt"
  >
    <template #title>
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
        v-if="!getDocumentFactureNetHref(document) && (document.documentType === 'quote' || document.documentType === 'invoice')"
        variant="soft"
        color="warning"
      >
        Lien Facture.net manquant
      </UBadge>
    </template>

    <template #meta>
      <p class="mt-1 text-sm text-gray-600">
        {{ document.filename }} • {{ formatFileSize(document.size) }}
      </p>
    </template>
  </AppAttachmentMeta>

  <div class="flex shrink-0 items-center gap-2">
    <UButton
      v-if="document.documentType === 'quote' || document.documentType === 'invoice'"
      size="sm"
      variant="soft"
      color="neutral"
      icon="i-lucide-external-link"
      :href="getDocumentFactureNetHref(document)"
      :disabled="!getDocumentFactureNetHref(document)"
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
      :href="getDocumentDownloadHref(document)"
      :disabled="!getDocumentDownloadHref(document)"
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
      @click="emit('delete-document', document.id)"
    />
  </div>
</template>
