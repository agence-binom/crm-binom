<script setup lang="ts">
import type { BillingProjectStatus } from '~/lib/billing'
import { applyStepSeparators, billingStepPalettes, getBillingStepActiveIndex, getBillingStepCategory, getBillingStepLabel, getDocumentWarning, mutedBillingStepPalette, type BillingStep, type StepPalette } from '~/lib/documents'
import { formatDateOnly } from '~/lib/utils'

const props = defineProps<{
  project: BillingProjectStatus
}>()

const isMuted = computed(() => props.project.billingStatus.tone === 'muted')

const activeIndex = computed(() => getBillingStepActiveIndex(props.project.billingSteps))

const paletteFor = (step: BillingStep, index: number): StepPalette => {
  if (isMuted.value) return step.status === 'completed' ? mutedBillingStepPalette.completed : mutedBillingStepPalette.other

  return billingStepPalettes[getBillingStepCategory(step, index, activeIndex.value, false)]
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
      title: getBillingStepLabel(step),
      description: document?.description || undefined,
      warning,
      ui: { indicator: palette.indicator, title: palette.titleClass, separator: undefined as string | undefined },
      line: palette.line,
      isSkipped
    }
  })

  return applyStepSeparators(nodes)
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
