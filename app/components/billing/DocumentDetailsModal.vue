<script setup lang="ts">
import {
  billingDocumentTypeIcons,
  documentStatusBadgeColors,
  documentStatusLabels,
  type BillingDocumentType
} from '~/lib/documents'
import { formatDate, formatFileSize } from '~/lib/utils'
import type { BillingDocumentRecord } from '~/types'

const props = defineProps<{
  open: boolean
  title: string
  documentType: BillingDocumentType
  document: BillingDocumentRecord | null
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const statusLabel = computed(() => {
  if (!props.document) return null
  return documentStatusLabels[props.documentType][props.document.status] ?? props.document.status
})

// The file keeps whatever description it was uploaded with; the step's own description can then be
// edited independently (BillingStepEditor only writes to billing_documents, never back to the file) -
// so once they diverge, both are worth showing rather than silently dropping the file's original one.
const showFileDescription = computed(() => (
  Boolean(props.document?.documentDescription?.trim())
  && props.document?.documentDescription !== props.document?.description
))
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    aria-describedby="Informations détaillées sur le document"
    :close="{
      color: 'error',
      variant: 'solid',
      icon: 'i-lucide-x',
      size: 'xs',
      label: 'Fermer'
    }"
    class="w-full max-w-lg rounded-2xl"
  >
    <template #body>
      <div
        v-if="document"
        class="space-y-4 text-sm"
      >
        <div class="flex items-center gap-2">
          <UIcon
            :name="billingDocumentTypeIcons[documentType]"
            class="size-4 text-slate-500"
          />
          <UBadge
            v-if="statusLabel"
            :color="documentStatusBadgeColors[document.status]"
            variant="soft"
            size="sm"
          >
            {{ statusLabel }}
          </UBadge>
        </div>

        <p
          v-if="document.description"
          class="whitespace-pre-line text-slate-700"
        >
          {{ document.description }}
        </p>

        <div v-if="showFileDescription">
          <p class="text-xs font-medium text-slate-500">
            Description du fichier
          </p>
          <p class="whitespace-pre-line text-slate-700">
            {{ document.documentDescription }}
          </p>
        </div>

        <div
          v-if="document.filename"
          class="space-y-1 rounded-lg bg-slate-50 p-3"
        >
          <p class="font-medium text-slate-700">
            {{ document.filename }}
          </p>
          <p class="text-xs text-slate-500">
            {{ formatFileSize(document.size || 0) }}
          </p>
        </div>

        <p
          v-if="document.documentCreatedAt"
          class="text-xs text-slate-400"
        >
          Déposé le {{ formatDate(document.documentCreatedAt) }}
        </p>
      </div>
    </template>
  </UModal>
</template>
