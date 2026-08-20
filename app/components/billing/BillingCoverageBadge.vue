<script setup lang="ts">
import type { BillingCoverage, BillingCoverageStatus } from '~/lib/billing'
import { billingDocumentTypeIcons, documentStatusLabels, type BillingDocumentType } from '~/lib/documents'

const props = defineProps<{
  label: string
  documentType: BillingDocumentType
  coverage: BillingCoverage
}>()

const statusColor: Record<BillingCoverageStatus, 'success' | 'warning' | 'neutral'> = {
  complete: 'success',
  partial: 'warning',
  none: 'neutral'
}
const statusLabel: Record<BillingCoverageStatus, string> = {
  complete: 'Complet',
  partial: 'Incomplet',
  none: 'Manquant'
}

const stageLabel = computed(() =>
  props.coverage.stage === 'none' ? null : documentStatusLabels[props.documentType][props.coverage.stage])
</script>

<template>
  <div class="flex flex-col gap-1.5 rounded-xl border border-slate-200 p-3">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-1.5 text-sm font-medium text-slate-700">
        <UIcon :name="billingDocumentTypeIcons[documentType]" />
        {{ label }}
      </div>
      <UBadge
        size="sm"
        variant="soft"
        :color="statusColor[coverage.status]"
        class="rounded-full"
      >
        {{ statusLabel[coverage.status] }}
      </UBadge>
    </div>
    <p class="text-xs text-slate-500">
      {{ coverage.total }} document{{ coverage.total > 1 ? 's' : '' }}
      <span v-if="stageLabel"> • {{ stageLabel }}</span>
    </p>
    <UBadge
      v-if="coverage.missingLinkCount > 0"
      size="sm"
      variant="soft"
      color="warning"
      class="w-fit rounded-full"
    >
      {{ coverage.missingLinkCount }} lien{{ coverage.missingLinkCount > 1 ? 's' : '' }} Facture.net manquant{{ coverage.missingLinkCount > 1 ? 's' : '' }}
    </UBadge>
  </div>
</template>
