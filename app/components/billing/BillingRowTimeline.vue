<script setup lang="ts">
import type { BillingProjectDocumentWithLifecycle } from '~/lib/billing'
import { billingDocumentTypeIcons, billingDocumentTypeLabels, getEffectiveInvoiceSubtype, invoiceSubtypeLabels, type BillingDocumentType, type DocumentStatus } from '~/lib/documents'

const props = defineProps<{
  documents: BillingProjectDocumentWithLifecycle[]
}>()

// `!` (important) forces these to win over UTimeline's own conditional `group-data-[state=completed]:bg-*`
// classes, which would otherwise sometimes out-specificity a plain override on the segments the built-in
// default-value/"current" mechanism marks as completed.
const indicatorClassByStatus: Record<DocumentStatus, string> = {
  draft: '!bg-slate-200 !text-slate-600',
  sent: '!bg-warning-100 !text-warning-700',
  completed: '!bg-success-500 !text-white',
  cancelled: '!bg-error-500 !text-white'
}
const placeholderIndicatorClass = '!bg-slate-100 !text-slate-300 ring-1 ring-inset ring-slate-200'

// The separator BEFORE a node is rendered as part of the PREVIOUS node's markup (UTimeline draws it right
// after the previous indicator), so this maps a node's status to the color of the line leading into it.
const separatorClassByStatus: Record<DocumentStatus, string> = {
  draft: '!bg-slate-300',
  sent: '!bg-warning-300',
  completed: '!bg-success-400',
  cancelled: '!bg-error-300'
}
const placeholderSeparatorClass = '!bg-slate-200'

type TimelineNode = {
  value: string | number
  icon: string
  title: string
  status: DocumentStatus | null
  ui: { indicator: string, separator?: string }
  isPlaceholder: boolean
}

const buildDocumentNode = (document: BillingProjectDocumentWithLifecycle): TimelineNode => {
  const effectiveSubtype = getEffectiveInvoiceSubtype(document)
  const title = effectiveSubtype
    ? `${invoiceSubtypeLabels[effectiveSubtype]}`
    : billingDocumentTypeLabels[document.type]

  return {
    value: document.id,
    icon: billingDocumentTypeIcons[document.type],
    title,
    status: document.status,
    ui: { indicator: indicatorClassByStatus[document.status] },
    isPlaceholder: false
  }
}

const buildPlaceholderNode = (type: BillingDocumentType, key: string): TimelineNode => ({
  value: key,
  icon: billingDocumentTypeIcons[type],
  title: billingDocumentTypeLabels[type],
  status: null,
  ui: { indicator: placeholderIndicatorClass },
  isPlaceholder: true
})

const sortByCreatedAtAsc = (a: BillingProjectDocumentWithLifecycle, b: BillingProjectDocumentWithLifecycle) => {
  const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
  const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
  return aTime - bTime || a.id - b.id
}

const timelineItems = computed(() => {
  const currentDocuments = props.documents.filter(document => document.lifecycle === 'current')

  const groups: Array<[BillingDocumentType, string]> = [
    ['commercial_proposal', 'proposal-placeholder'],
    ['quote', 'quote-placeholder'],
    ['invoice', 'invoice-placeholder']
  ]

  const nodes = groups.flatMap(([type, placeholderKey]) => {
    const documentsForType = currentDocuments.filter(document => document.type === type).sort(sortByCreatedAtAsc)

    return documentsForType.length > 0
      ? documentsForType.map(buildDocumentNode)
      : [buildPlaceholderNode(type, placeholderKey)]
  })

  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    if (!nodes[index]!.isPlaceholder) {
      nodes[index]!.value = 'current'
      break
    }
  }

  for (let index = 0; index < nodes.length - 1; index += 1) {
    const nextNode = nodes[index + 1]!
    nodes[index]!.ui.separator = nextNode.status ? separatorClassByStatus[nextNode.status] : placeholderSeparatorClass
  }

  return nodes
})
</script>

<template>
  <UTimeline
    :items="timelineItems"
    default-value="current"
    orientation="horizontal"
    size="sm"
    class="w-full"
    :ui="{
      item: 'gap-0.5 min-w-0',
      title: 'text-xs'
    }"
  />
</template>
