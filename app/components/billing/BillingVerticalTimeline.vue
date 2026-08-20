<script setup lang="ts">
import { billingDocumentTypeIcons, type BillingDocumentType, type DocumentLifecycle } from '~/lib/documents'
import { billingDocumentTypeLabels, getDocumentDownloadHref, getDocumentFactureNetHref, invoiceSubtypeLabels } from '~/lib/documents'
import { formatDate } from '~/lib/utils'
import type { ProjectDocument } from '~/types'

type TimelineDocument = ProjectDocument & {
  type: BillingDocumentType
  lifecycle: DocumentLifecycle
  supersededByDocumentId: number | null
}

const props = defineProps<{
  documents: TimelineDocument[]
}>()

const { getDocumentStatusIndicatorClass } = useDocumentStatusHelpers()

// Full history here (unlike the row timeline): most recent first, superseded documents included.
const timelineItems = computed(() => [...props.documents]
  .sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bTime - aTime || b.id - a.id
  })
  .map(document => ({
    value: document.id,
    icon: billingDocumentTypeIcons[document.type],
    date: formatDate(document.createdAt),
    title: `${document.subtype ? invoiceSubtypeLabels[document.subtype as keyof typeof invoiceSubtypeLabels] : billingDocumentTypeLabels[document.type]} (${document.filename})`,
    description: document.description ?? undefined,
    status: document.status,
    ui: { indicator: getDocumentStatusIndicatorClass(document.status) },
    class: document.lifecycle === 'superseded' ? 'opacity-60' : '',
    document
  })))
</script>

<template>
  <UTimeline
    v-if="timelineItems.length > 0"
    :items="timelineItems"
    orientation="vertical"
    size="md"
  >
    <template #description="{ item }">
      <p
        v-if="item.description"
        class="text-sm text-slate-500"
      >
        {{ item.description }}
      </p>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <UButton
          v-if="item.document.type === 'quote' || item.document.type === 'invoice'"
          size="xs"
          variant="soft"
          color="neutral"
          icon="i-lucide-external-link"
          :href="getDocumentFactureNetHref(item.document)"
          :disabled="!getDocumentFactureNetHref(item.document)"
          target="_blank"
          rel="noopener noreferrer"
        >
          Facture.net
        </UButton>
        <UButton
          size="xs"
          variant="soft"
          color="neutral"
          icon="i-lucide-eye"
          :href="getDocumentDownloadHref(item.document)"
          :disabled="!getDocumentDownloadHref(item.document)"
          target="_blank"
          rel="noopener noreferrer"
        >
          Aperçu
        </UButton>
        <UButton
          size="xs"
          variant="soft"
          color="primary"
          icon="i-lucide-download"
          :href="getDocumentDownloadHref(item.document)"
          :disabled="!getDocumentDownloadHref(item.document)"
          target="_blank"
          rel="noopener noreferrer"
        >
          Télécharger
        </UButton>
      </div>
    </template>
  </UTimeline>
  <AppEmptyState
    v-else
    variant="compact"
    icon="i-lucide-file-x"
    title="Aucun document"
  />
</template>
