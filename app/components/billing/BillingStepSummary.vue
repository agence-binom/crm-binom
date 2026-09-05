<script setup lang="ts">
import { getBillingDocumentTitle, getDocumentFactureNetHref, getDocumentWarning, requiresFactureNetLink as isFactureNetLinkRequired, type BillingDocumentType, type InvoiceSubtype } from '~/lib/documents'
import type { BillingDocumentRecord } from '~/types'

const props = defineProps<{
  documentType: BillingDocumentType
  subtype?: InvoiceSubtype
  dateLabel: string
  document: BillingDocumentRecord | null
}>()

const requiresFactureNetLink = computed(() => isFactureNetLinkRequired(props.documentType))
const factureNetHref = computed(() => getDocumentFactureNetHref(props.document ?? {}))

const { isDetailsOpen, menuItems } = useDetailsMenuItem()
const detailsTitle = computed(() => getBillingDocumentTitle(props))

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

    <UButton
      v-if="requiresFactureNetLink && factureNetHref"
      :href="factureNetHref"
      target="_blank"
      rel="noopener noreferrer"
      variant="soft"
      color="neutral"
      size="sm"
      icon="i-lucide-external-link"
    >
      Lien vers Facture.net
    </UButton>

    <BillingDocumentFileCard
      :document="document"
      :document-type="documentType"
    >
      <template
        v-if="document"
        #extra-actions
      >
        <AppActionsMenu :items="menuItems" />
      </template>

      <template #empty>
        <div class="flex items-center justify-between gap-3">
          <p class="text-xs text-slate-500">
            Aucun document
          </p>
          <AppActionsMenu
            v-if="document"
            :items="menuItems"
          />
        </div>
      </template>
    </BillingDocumentFileCard>

    <BillingDocumentDetailsModal
      v-model:open="isDetailsOpen"
      :title="detailsTitle"
      :document-type="documentType"
      :document="document"
    />
  </div>
</template>
