<script setup lang="ts">
import type { BillingProjectStatus } from '~/lib/billing'
import { billingDocumentTypeLabels, getDocumentWarning, invoiceSubtypeLabels, type BillingStep } from '~/lib/documents'
import { formatDateOnly } from '~/lib/utils'

const props = defineProps<{
  project: BillingProjectStatus
}>()

type StepPalette = { icon?: string, indicator: string, line: string, titleClass: string }

const palettes: Record<'completed' | 'sent' | 'negative' | 'active' | 'pending', StepPalette> = {
  completed: { icon: 'i-lucide-check', indicator: 'bg-success-500 text-white', line: 'bg-success-500', titleClass: 'font-semibold' },
  sent: { icon: 'i-lucide-hourglass', indicator: 'bg-warning-500 text-white', line: 'bg-warning-500', titleClass: 'font-semibold' },
  negative: { icon: 'i-lucide-x', indicator: 'bg-slate-100 text-slate-400', line: 'bg-slate-200', titleClass: 'text-slate-400 line-through' },
  active: { icon: 'i-lucide-circle', indicator: 'bg-info-500 text-white', line: 'bg-info-500', titleClass: 'font-semibold' },
  pending: { indicator: 'bg-slate-100 text-slate-300', line: 'bg-slate-200', titleClass: 'text-slate-400' }
}

const mutedPalette: Record<'completed' | 'other', StepPalette> = {
  completed: { icon: 'i-lucide-check', indicator: 'bg-slate-200 text-slate-400', line: 'bg-slate-200', titleClass: 'text-slate-400 font-semibold' },
  other: { icon: 'i-lucide-x', indicator: 'bg-slate-100 text-slate-400', line: 'bg-slate-200', titleClass: 'text-slate-400 line-through' }
}

const stepLabel = (step: BillingStep) => {
  if (step.key === 'acompte') return invoiceSubtypeLabels.acompte
  if (step.key === 'invoice') return step.subtype ? invoiceSubtypeLabels[step.subtype] : billingDocumentTypeLabels.invoice
  return billingDocumentTypeLabels[step.documentType]
}

const isMuted = computed(() => props.project.actionCta.tone === 'muted')

const activeIndex = computed(() => props.project.billingSteps.findIndex(step => step.status === 'draft' || step.status === 'sent'))

const paletteFor = (step: BillingStep, index: number): StepPalette => {
  if (isMuted.value) return step.status === 'completed' ? mutedPalette.completed : mutedPalette.other

  switch (step.status) {
    case 'completed': return palettes.completed
    case 'sent': return palettes.sent
    case 'non_applicable':
    case 'cancelled':
    case 'refused': return palettes.negative
    default: return index === activeIndex.value ? palettes.active : palettes.pending
  }
}

const timelineItems = computed(() => {
  const documentsById = new Map(props.project.documents.map(document => [document.id, document]))

  const nodes = props.project.billingSteps.map((step, index) => {
    const document = step.documentId ? documentsById.get(step.documentId) : undefined
    const palette = paletteFor(step, index)

    const warning = document
      ? getDocumentWarning({
          type: document.type,
          status: document.status,
          hasFile: document.hasFile,
          hasLink: document.hasLink,
          statusDate: document.statusDate
        })
      : null

    return {
      value: step.documentId ?? step.key,
      icon: palette.icon,
      date: step.status === 'completed' ? formatDateOnly(document?.statusDate ?? document?.createdAt) : undefined,
      title: stepLabel(step),
      description: document?.description || undefined,
      warning,
      ui: { indicator: palette.indicator, title: palette.titleClass, separator: undefined as string | undefined },
      line: palette.line
    }
  })

  for (let index = 0; index < nodes.length - 1; index += 1) {
    nodes[index]!.ui.separator = nodes[index + 1]!.line
  }

  return nodes
})
</script>

<template>
  <UTimeline
    :items="timelineItems"
    orientation="horizontal"
    size="sm"
    class="w-full"
    :ui="{
      item: 'gap-0.5 min-w-0',
      wrapper: 'max-w-40',
      date: 'text-xs',
      title: 'text-xs truncate'
    }"
  >
    <template #description="{ item }">
      <p
        v-if="item.warning || item.description"
        class="truncate text-xs"
        :class="item.warning ? 'font-medium text-error-500' : 'text-slate-400'"
        :title="item.warning || item.description"
      >
        {{ item.warning || item.description }}
      </p>
    </template>
  </UTimeline>
</template>
