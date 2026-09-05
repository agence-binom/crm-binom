<script setup lang="ts">
import {
  billingDocumentTypeIcons,
  billingDocumentTypeLabels,
  documentStatusBadgeColors,
  documentStatusLabels,
  getDocumentDownloadHref,
  getEffectiveInvoiceSubtype,
  invoiceSubtypeLabels,
  type BillingDocumentType
} from '~/lib/documents'
import { sortByCreatedAtDesc } from '~/lib/utils'
import type { BillingDocumentRecord } from '~/types'

const props = defineProps<{
  documents: BillingDocumentRecord[]
}>()

const sortedDocuments = computed(() => (
  sortByCreatedAtDesc(props.documents).map(document => ({
    ...document,
    downloadHref: getDocumentDownloadHref(document)
  }))
))

const getTitle = (document: BillingDocumentRecord) => {
  const type = document.documentType as BillingDocumentType
  if (type !== 'invoice') return billingDocumentTypeLabels[type]
  return invoiceSubtypeLabels[getEffectiveInvoiceSubtype({ type, subtype: document.subtype }) ?? 'unique']
}

const getStatusLabel = (document: BillingDocumentRecord) => (
  documentStatusLabels[document.documentType as BillingDocumentType][document.status] ?? document.status
)
</script>

<template>
  <div
    v-if="sortedDocuments.length"
    class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
  >
    <div
      v-for="document in sortedDocuments"
      :key="document.id"
      class="flex items-start justify-between gap-4 rounded-xl border border-default p-4"
    >
      <component
        :is="document.downloadHref ? 'a' : 'div'"
        :href="document.downloadHref"
        :target="document.downloadHref ? '_blank' : undefined"
        rel="noopener noreferrer"
        class="flex min-w-0 flex-1"
      >
        <AppAttachmentMeta
          :icon="billingDocumentTypeIcons[document.documentType as BillingDocumentType]"
          :description="document.description"
          :created-at="document.statusDate ?? document.createdAt"
        >
          <template #title>
            <p class="truncate font-medium">
              {{ getTitle(document) }}
            </p>
            <UBadge
              :color="documentStatusBadgeColors[document.status]"
              variant="soft"
              size="sm"
            >
              {{ getStatusLabel(document) }}
            </UBadge>
          </template>

          <template #meta>
            <p
              v-if="document.filename"
              class="mt-1 truncate text-sm text-gray-600"
            >
              {{ document.filename }}
            </p>
          </template>
        </AppAttachmentMeta>
      </component>
    </div>
  </div>

  <AppEmptyState
    v-else
    icon="i-lucide-file-text"
    title="Aucun document pour le moment"
    description="Votre proposition commerciale, votre devis et vos factures apparaîtront ici."
  />
</template>
