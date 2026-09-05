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

const isMuted = computed(() => props.project.billingStatus.tone === 'muted')

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

    const isSkipped = isMuted.value
      ? step.status !== 'completed'
      : step.status === 'non_applicable' || step.status === 'cancelled' || step.status === 'refused'

    return {
      value: step.documentId ?? step.key,
      icon: palette.icon,
      date: step.status === 'completed' ? formatDateOnly(document?.statusDate ?? document?.createdAt) : undefined,
      title: stepLabel(step),
      description: document?.description || undefined,
      warning,
      ui: { indicator: palette.indicator, title: palette.titleClass, separator: undefined as string | undefined },
      line: palette.line,
      isSkipped
    }
  })

  // A skipped step keeps its neutral color, but the line leading into it should
  // continue the color of the next non-skipped step instead of resetting to grey.
  const nextRealLine: string[] = new Array(nodes.length)
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const node = nodes[index]!
    nextRealLine[index] = node.isSkipped && index < nodes.length - 1 ? nextRealLine[index + 1]! : node.line
  }

  for (let index = 0; index < nodes.length - 1; index += 1) {
    nodes[index]!.ui.separator = nextRealLine[index + 1]
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
      title: 'text-xs'
    }"
  >
    <template #title="{ item }">
      <span class="flex min-w-0 items-center gap-1">
        <span class="truncate">{{ item.title }}</span>
        <UTooltip
          v-if="item.warning"
          :text="item.warning"
        >
          <UIcon
            name="i-lucide-triangle-alert"
            class="size-3.5 shrink-0 text-warning-500"
          />
        </UTooltip>
      </span>
    </template>

    <template #description="{ item }">
      <p
        v-if="item.description"
        class="truncate text-xs text-slate-400"
        :title="item.description"
      >
        {{ item.description }}
      </p>
    </template>
  </UTimeline>
</template>
