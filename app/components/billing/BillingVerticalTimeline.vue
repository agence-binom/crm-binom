<script setup lang="ts">
import { billingDocumentTypeIcons, type BillingDocumentType, type DocumentLifecycle } from '~/lib/documents'
import { billingDocumentTypeLabels, invoiceSubtypeLabels } from '~/lib/documents'
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

const indicatorClassByStatus: Partial<Record<TimelineDocument['status'], string>> = {
  draft: 'bg-slate-200 text-slate-600',
  sent: 'bg-warning-100 text-warning-700',
  completed: 'bg-success-500 text-white',
  cancelled: 'bg-error-500 text-white'
}
const defaultIndicatorClass = 'bg-slate-200 text-slate-600'
console.log(props.documents)
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
    ui: { indicator: indicatorClassByStatus[document.status] ?? defaultIndicatorClass },
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
  />
  <p
    v-else
    class="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400"
  >
    Aucun document
  </p>
</template>
