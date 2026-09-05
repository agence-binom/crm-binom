<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { billingDocumentTypeIcons, getBillingDocumentTitle, type BillingDocumentType } from '~/lib/documents'
import { sortByCreatedAtDesc } from '~/lib/utils'
import type { BillingDocumentRecord } from '~/types'

const props = defineProps<{
  documents: BillingDocumentRecord[]
}>()

const sortedDocuments = computed(() => sortByCreatedAtDesc(props.documents))

const getTitle = getBillingDocumentTitle

const selectedDocument = ref<BillingDocumentRecord | null>(null)

const getMenuItems = (document: BillingDocumentRecord): DropdownMenuItem[][] => [[
  {
    label: 'Voir les informations',
    icon: 'i-lucide-info',
    onSelect: () => { selectedDocument.value = document }
  }
]]
</script>

<template>
  <div
    v-if="sortedDocuments.length"
    class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
  >
    <div
      v-for="document in sortedDocuments"
      :key="document.id"
      class="flex flex-col gap-2"
    >
      <div class="flex items-center gap-2 text-sm font-medium text-slate-900">
        <UIcon
          :name="billingDocumentTypeIcons[document.documentType as BillingDocumentType]"
          class="size-4 shrink-0 text-slate-500"
        />
        {{ getTitle(document) }}
      </div>

      <BillingDocumentFileCard
        :document="document"
        :document-type="document.documentType as BillingDocumentType"
        :warn-on-missing-link="false"
      >
        <template #extra-actions>
          <AppActionsMenu :items="getMenuItems(document)" />
        </template>

        <template #empty>
          <div class="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-200 px-3 py-2.5">
            <p class="text-xs text-slate-500">
              Document à venir
            </p>
            <AppActionsMenu :items="getMenuItems(document)" />
          </div>
        </template>
      </BillingDocumentFileCard>
    </div>
  </div>

  <AppEmptyState
    v-else
    icon="i-lucide-file-text"
    title="Aucun document pour le moment"
    description="Votre proposition commerciale, votre devis et vos factures apparaîtront ici."
  />

  <BillingDocumentDetailsModal
    :open="selectedDocument !== null"
    :title="selectedDocument ? getTitle(selectedDocument) : ''"
    :document-type="(selectedDocument?.documentType as BillingDocumentType) ?? 'invoice'"
    :document="selectedDocument"
    @update:open="(value) => { if (!value) selectedDocument = null }"
  />
</template>
