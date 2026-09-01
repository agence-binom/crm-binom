<script setup lang="ts">
import type { BillingProjectStatus } from '~/lib/billing'
import { billingDocumentTypeLabels, invoiceSubtypeLabels, type BillingStep } from '~/lib/documents'
import { formatDateOnly } from '~/lib/utils'

const props = defineProps<{
  project: BillingProjectStatus
}>()

// Per the Figma state-machine spec: draft/sent/completed/negative each have a fixed icon + color,
// except "draft" which is only ever painted blue for the single step currently blocking progress —
// every other draft step (not yet reached) stays a plain gray placeholder.
type StepPalette = { icon?: string, indicator: string, line: string, titleClass: string }

const palettes: Record<'completed' | 'sent' | 'negative' | 'active' | 'pending', StepPalette> = {
  completed: { icon: 'i-lucide-check', indicator: 'bg-success-500 text-white', line: 'bg-success-500', titleClass: 'font-semibold' },
  sent: { icon: 'i-lucide-hourglass', indicator: 'bg-warning-500 text-white', line: 'bg-warning-500', titleClass: 'font-semibold' },
  negative: { icon: 'i-lucide-x', indicator: 'bg-slate-100 text-slate-400', line: 'bg-slate-200', titleClass: 'text-slate-400 line-through' },
  active: { icon: 'i-lucide-circle', indicator: 'bg-info-500 text-white', line: 'bg-info-500', titleClass: 'font-semibold' },
  pending: { indicator: 'bg-slate-100 text-slate-300', line: 'bg-slate-200', titleClass: 'text-slate-400' }
}

// A "Sans suite" project (a real refusal/cancellation happened somewhere) is grayed out entirely —
// even previously-validated steps lose their green check — to signal the whole flow is dead.
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

    return {
      value: step.documentId ?? step.key,
      icon: palette.icon,
      date: step.status === 'completed' ? formatDateOnly(document?.statusDate ?? document?.createdAt) : undefined,
      title: stepLabel(step),
      description: document?.description || undefined,
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
      title: 'text-xs truncate',
      description: 'text-xs text-slate-400 truncate'
    }"
  />
</template>
