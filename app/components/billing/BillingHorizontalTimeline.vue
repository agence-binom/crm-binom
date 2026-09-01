<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { billingDocumentTypeIcons, billingDocumentTypeLabels, documentStatusLabels, getDocumentDownloadHref, getDocumentFactureNetHref, invoiceSubtypeLabels, type BillingDocumentType, type DocumentLifecycle, type DocumentStatus } from '~/lib/documents'
import { documentStatusesByType } from '~/validation/billing-documents'
import { formatDate, getErrorMessage } from '~/lib/utils'
import type { BillingDocumentRecord } from '~/types'

type TimelineDocument = BillingDocumentRecord & {
  type: BillingDocumentType
  lifecycle: DocumentLifecycle
  supersededByDocumentId: number | null
}

const props = defineProps<{
  documents: TimelineDocument[]
}>()

const emit = defineEmits<{
  'delete-document': [documentId: number]
  'update-document': []
}>()

const toast = useToast()
const { getDocumentStatusIndicatorClass, getDocumentStatusSeparatorClass } = useDocumentStatusHelpers()

const statusBadgeColors: Record<DocumentStatus, 'neutral' | 'warning' | 'success' | 'error'> = {
  draft: 'neutral',
  sent: 'warning',
  completed: 'success',
  cancelled: 'error',
  refused: 'error',
  non_applicable: 'neutral'
}

const updatingStatusId = ref<number | null>(null)

const onStatusChange = async (document: TimelineDocument, status: DocumentStatus) => {
  if (status === document.status) return

  updatingStatusId.value = document.id
  try {
    await $fetch(`/api/billing-documents/${document.id}`, {
      method: 'PUT',
      body: { status }
    })
    emit('update-document')
  } catch (error) {
    toast.add({
      title: 'Échec de la mise à jour',
      description: getErrorMessage(error, 'Impossible de mettre à jour le statut du document.'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    updatingStatusId.value = null
  }
}

const statusMenuItems = (document: TimelineDocument): DropdownMenuItem[][] => [
  documentStatusesByType[document.type].map(status => ({
    label: documentStatusLabels[document.type][status],
    icon: status === document.status ? 'i-lucide-check' : undefined,
    onSelect: () => onStatusChange(document, status)
  }))
]

// Horizontal reads left → right, so oldest first (unlike the vertical timeline's newest-first order).
const timelineItems = computed(() => {
  const sorted = [...props.documents]
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return aTime - bTime || a.id - b.id
    })
    .map(document => ({
      value: document.id,
      icon: billingDocumentTypeIcons[document.type],
      date: formatDate(document.createdAt),
      title: document.subtype
        ? invoiceSubtypeLabels[document.subtype as keyof typeof invoiceSubtypeLabels]
        : billingDocumentTypeLabels[document.type],
      status: document.status,
      ui: { indicator: getDocumentStatusIndicatorClass(document.status), separator: undefined as string | undefined },
      class: document.lifecycle === 'superseded' ? 'opacity-60' : '',
      document
    }))

  // The separator leading out of an item is colored by the status of the item it leads into.
  for (let index = 0; index < sorted.length - 1; index += 1) {
    sorted[index]!.ui.separator = getDocumentStatusSeparatorClass(sorted[index + 1]!.status)
  }

  return sorted
})
</script>

<template>
  <div
    v-if="timelineItems.length > 0"
    class="overflow-x-auto pb-6 pl-4"
  >
    <UTimeline
      :items="timelineItems"
      orientation="horizontal"
      size="md"
      class="min-w-max"
    >
      <template #description="{ item }">
        <div class="flex max-w-40 flex-col gap-2">
          <p
            class="truncate text-sm text-slate-500"
            :title="item.document.filename ?? 'Aucun fichier'"
          >
            {{ item.document.filename ?? 'Aucun fichier' }}
          </p>

          <div class="flex flex-wrap items-center gap-1.5">
            <UDropdownMenu :items="statusMenuItems(item.document)">
              <UButton
                size="xs"
                variant="soft"
                :color="statusBadgeColors[item.document.status]"
                trailing-icon="i-lucide-chevron-down"
                :loading="updatingStatusId === item.document.id"
              >
                {{ documentStatusLabels[item.document.type][item.document.status] }}
              </UButton>
            </UDropdownMenu>

            <UTooltip
              v-if="(item.document.type === 'quote' || item.document.type === 'invoice') && !getDocumentFactureNetHref(item.document)"
              text="Lien Facture.net manquant"
            >
              <UIcon
                name="i-lucide-triangle-alert"
                class="size-4 shrink-0 text-warning-500"
              />
            </UTooltip>
          </div>

          <div class="flex items-center gap-1">
            <UTooltip
              v-if="item.document.type === 'quote' || item.document.type === 'invoice'"
              text="Ouvrir sur Facture.net"
            >
              <UButton
                size="sm"
                variant="soft"
                color="neutral"
                icon="i-lucide-external-link"
                :href="getDocumentFactureNetHref(item.document)"
                :disabled="!getDocumentFactureNetHref(item.document)"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ouvrir le document sur Facture.net"
              />
            </UTooltip>
            <UTooltip text="Aperçu">
              <UButton
                size="sm"
                variant="soft"
                color="neutral"
                icon="i-lucide-eye"
                :href="getDocumentDownloadHref(item.document)"
                :disabled="!getDocumentDownloadHref(item.document)"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Aperçu du document"
              />
            </UTooltip>
            <UTooltip text="Télécharger">
              <UButton
                size="sm"
                variant="soft"
                color="primary"
                icon="i-lucide-download"
                :href="getDocumentDownloadHref(item.document)"
                :disabled="!getDocumentDownloadHref(item.document)"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Télécharger le document"
              />
            </UTooltip>

            <div class="mx-0.5 h-4 w-px shrink-0 bg-slate-200" />

            <UTooltip text="Supprimer">
              <UButton
                size="sm"
                variant="soft"
                color="error"
                icon="i-lucide-trash-2"
                aria-label="Supprimer le document"
                @click="emit('delete-document', item.document.id)"
              />
            </UTooltip>
          </div>
        </div>
      </template>
    </UTimeline>
  </div>
  <AppEmptyState
    v-else
    variant="compact"
    icon="i-lucide-file-x"
    title="Aucun document"
  />
</template>
