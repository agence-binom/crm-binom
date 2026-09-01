<script setup lang="ts">
import { documentStatusesByType } from '~/validation/billing-documents'
import { billingDocumentTypesRequiringFactureNetLink, documentStatusLabels, getDocumentWarning, type BillingDocumentType, type DocumentStatus, type InvoiceSubtype } from '~/lib/documents'
import { toProjectInputDate } from '~/lib/projects'
import { formatFileSize } from '~/lib/utils'
import type { BillingDocumentRecord } from '~/types'

const props = defineProps<{
  projectId: number
  title: string
  documentType: BillingDocumentType
  subtype?: InvoiceSubtype
  dateLabel: string
  document: BillingDocumentRecord | null
  requiresAcompte?: boolean
  uploadDisabled?: boolean
}>()

const emit = defineEmits<{
  'saved': []
  'update:requires-acompte': [value: boolean]
}>()

const { showError } = useFeedbackToast()

const status = ref<DocumentStatus>(props.document?.status ?? 'draft')
const statusDateInput = ref(toProjectInputDate(props.document?.statusDate))
const description = ref(props.document?.description ?? '')
const externalUrlInput = ref(props.document?.externalUrl ?? '')
const isUploadModalOpen = ref(false)

const resetDraft = () => {
  status.value = props.document?.status ?? 'draft'
  statusDateInput.value = toProjectInputDate(props.document?.statusDate)
  description.value = props.document?.description ?? ''
  externalUrlInput.value = props.document?.externalUrl ?? ''
}

watch(() => props.document, resetDraft)

const statusOptions = computed(() => documentStatusesByType[props.documentType].map(value => ({
  label: documentStatusLabels[props.documentType][value],
  value
})))

// Compared field-by-field against the last-saved `document` prop rather than tracked with a single
// "touched" flag, so a value typed back to its original state is correctly seen as clean again.
const isDirty = computed(() =>
  status.value !== (props.document?.status ?? 'draft')
  || statusDateInput.value !== toProjectInputDate(props.document?.statusDate)
  || description.value !== (props.document?.description ?? '')
  || externalUrlInput.value !== (props.document?.externalUrl ?? '')
)

// Called by the parent's "Enregistrer" — not wired to any local event, since fields no longer
// save themselves on change/blur.
const save = async () => {
  if (!isDirty.value) return

  const payload = {
    status: status.value,
    statusDate: statusDateInput.value || undefined,
    description: description.value,
    externalUrl: externalUrlInput.value
  }

  try {
    if (props.document) {
      await $fetch(`/api/billing-documents/${props.document.id}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/billing-documents', {
        method: 'POST',
        body: {
          projectId: props.projectId,
          documentType: props.documentType,
          subtype: props.subtype,
          ...payload
        }
      })
    }
  } catch (error) {
    showError('Échec de l\'enregistrement', error, `Impossible d'enregistrer l'étape "${props.title}".`)
    throw error
  }
}

const onUploaded = () => {
  emit('saved')
}

const requiresFactureNetLink = computed(() => billingDocumentTypesRequiringFactureNetLink.includes(props.documentType))

// Reads the in-progress draft rather than the last-saved `document`, so a step being pushed
// past "draft" for the very first time (no document exists yet) still warns before the user
// hits save, instead of only after the server rejects it.
const warning = computed(() => getDocumentWarning({
  type: props.documentType,
  status: status.value,
  hasFile: Boolean(props.document?.documentId),
  hasLink: Boolean(externalUrlInput.value.trim()),
  statusDate: statusDateInput.value || props.document?.statusDate
}))

defineExpose({ isDirty, save, reset: resetDraft })
</script>

<template>
  <div class="space-y-4 border-b border-slate-200 py-6 last:border-b-0">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-900">
        {{ title }}
      </h3>
      <div
        v-if="documentType === 'quote'"
        class="flex items-center gap-2"
      >
        <span class="text-xs font-medium text-slate-500">Acompte</span>
        <USwitch
          :model-value="requiresAcompte"
          @update:model-value="(value: boolean) => emit('update:requires-acompte', value)"
        />
      </div>
    </div>

    <div
      v-if="warning"
      class="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm font-medium text-error-600"
    >
      <UIcon
        name="i-lucide-triangle-alert"
        class="size-4 shrink-0"
      />
      <span>{{ warning }}</span>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="État">
        <USelect
          v-model="status"
          :items="statusOptions"
          value-attribute="value"
          option-attribute="label"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="dateLabel">
        <UInput
          v-model="statusDateInput"
          type="date"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField
      v-if="requiresFactureNetLink"
      label="Lien Facture.net"
    >
      <UInput
        v-model="externalUrlInput"
        type="url"
        placeholder="https://www.facture.net/..."
        class="w-full"
      />
    </UFormField>

    <UFormField label="Description">
      <UTextarea
        v-model="description"
        :rows="2"
        class="w-full"
      />
    </UFormField>

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
          v-if="document"
          :document="document"
          :document-type="documentType"
          warn-on-missing-link
        />
      </div>
    </div>

    <UTooltip :text="uploadDisabled ? 'Enregistrez ou annulez vos modifications avant d\'ajouter un document.' : undefined">
      <UButton
        size="sm"
        variant="soft"
        color="neutral"
        :icon="document?.filename ? 'i-lucide-refresh-cw' : 'i-lucide-plus'"
        :disabled="uploadDisabled"
        @click="isUploadModalOpen = true"
      >
        {{ document?.filename ? 'Remplacer le document' : 'Ajouter un document' }}
      </UButton>
    </UTooltip>

    <UploadModal
      v-model:open="isUploadModalOpen"
      :project-id="projectId"
      :document-type="documentType"
      :subtype="subtype"
      :title="`Ajouter un document - ${title}`"
      @uploaded="onUploaded"
    />
  </div>
</template>
