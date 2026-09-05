<script setup lang="ts">
import { billingDocumentTypesRequiringFactureNetLink, getDocumentFactureNetHref, getDocumentWarning, type BillingDocumentType, type InvoiceSubtype } from '~/lib/documents'
import { formatDateOnly, formatFileSize } from '~/lib/utils'
import type { BillingDocumentRecord } from '~/types'

const props = defineProps<{
  documentType: BillingDocumentType
  subtype?: InvoiceSubtype
  dateLabel: string
  document: BillingDocumentRecord | null
}>()

const requiresFactureNetLink = computed(() => billingDocumentTypesRequiringFactureNetLink.includes(props.documentType))
const factureNetHref = computed(() => getDocumentFactureNetHref(props.document ?? {}))

// Mirrors BillingStepEditor's own warning computation, but reads straight off the saved
// document since there's no in-progress draft to fall back to in the read-only view.
const warning = computed(() => getDocumentWarning({
  type: props.documentType,
  status: props.document?.status ?? 'draft',
  hasFile: Boolean(props.document?.documentId),
  hasLink: Boolean(props.document?.externalUrl?.trim()),
  statusDate: props.document?.statusDate
}))
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="warning"
      role="alert"
      class="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm font-medium text-error-600"
    >
      <UIcon
        name="i-lucide-triangle-alert"
        class="size-4 shrink-0"
      />
      <span>{{ warning }}</span>
    </div>

    <dl class="grid gap-4 sm:grid-cols-2">
      <div>
        <dt class="text-xs font-medium text-slate-500">
          {{ dateLabel }}
        </dt>
        <dd class="mt-1 text-sm text-slate-700">
          {{ document?.statusDate ? formatDateOnly(document.statusDate) : 'Non renseignée' }}
        </dd>
      </div>

      <div v-if="requiresFactureNetLink">
        <dt class="text-xs font-medium text-slate-500">
          Lien Facture.net
        </dt>
        <dd class="mt-1 text-sm">
          <a
            v-if="factureNetHref"
            :href="factureNetHref"
            target="_blank"
            rel="noopener noreferrer"
            class="block truncate text-sky-600 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            {{ document?.externalUrl }}
          </a>
          <span
            v-else
            class="text-slate-500"
          >Non renseigné</span>
        </dd>
      </div>
    </dl>

    <div>
      <dt class="text-xs font-medium text-slate-500">
        Description
      </dt>
      <dd class="mt-1 text-sm whitespace-pre-wrap text-slate-700">
        {{ document?.description || 'Aucune description' }}
      </dd>
    </div>

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
    <p
      v-else
      class="text-xs text-slate-500"
    >
      Aucun document
    </p>
  </div>
</template>
