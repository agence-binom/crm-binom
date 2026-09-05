<script setup lang="ts">
import type { BillingDocumentType } from '~/lib/documents'
import { formatFileSize } from '~/lib/utils'
import type { BillingDocumentRecord } from '~/types'

defineProps<{
  document: BillingDocumentRecord | null
  documentType: BillingDocumentType
}>()
</script>

<template>
  <div
    v-if="document?.filename"
    class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
  >
    <div class="min-w-0">
      <p
        class="truncate text-sm font-medium text-slate-700"
        :title="document.filename"
      >
        {{ document.filename }}
      </p>
      <p class="text-xs text-slate-500">
        {{ formatFileSize(document.size || 0) }}
      </p>
    </div>

    <div class="flex shrink-0 items-center gap-1.5">
      <BillingDocumentActionButtons
        :document="document"
        :document-type="documentType"
        warn-on-missing-link
      />
    </div>
  </div>
  <slot
    v-else
    name="empty"
  />
</template>
