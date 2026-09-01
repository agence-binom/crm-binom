<script setup lang="ts">
import { documentStatusesByType } from '~/validation/billing-documents'
import { documentStatusLabels, type BillingDocumentType, type DocumentStatus, type InvoiceSubtype } from '~/lib/documents'
import { toProjectInputDate } from '~/lib/projects'
import type { BillingDocumentRecord } from '~/types'

const props = defineProps<{
  projectId: number
  title: string
  documentType: BillingDocumentType
  subtype?: InvoiceSubtype
  dateLabel: string
  document: BillingDocumentRecord | null
  requiresAcompte?: boolean
}>()

const emit = defineEmits<{
  'saved': []
  'update:requires-acompte': [value: boolean]
}>()

const { showError } = useFeedbackToast()

const status = ref<DocumentStatus>(props.document?.status ?? 'draft')
const statusDateInput = ref(toProjectInputDate(props.document?.statusDate))
const description = ref(props.document?.description ?? '')
const isSavingStatus = ref(false)
const isSavingDetails = ref(false)
const isUploadModalOpen = ref(false)

watch(() => props.document, (document) => {
  status.value = document?.status ?? 'draft'
  statusDateInput.value = toProjectInputDate(document?.statusDate)
  description.value = document?.description ?? ''
})

const statusOptions = computed(() => documentStatusesByType[props.documentType].map(value => ({
  label: documentStatusLabels[props.documentType][value],
  value
})))

const saveStep = async (payload: { status?: DocumentStatus, statusDate?: string, description?: string }) => {
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
          status: payload.status ?? status.value,
          statusDate: payload.statusDate,
          description: payload.description ?? description.value
        }
      })
    }

    emit('saved')
  } catch (error) {
    showError('Échec de la mise à jour', error, `Impossible de mettre à jour l'étape "${props.title}".`)
  }
}

const onStatusChange = async (value: DocumentStatus) => {
  if (value === status.value && props.document) return

  status.value = value
  isSavingStatus.value = true
  try {
    await saveStep({ status: value })
  } finally {
    isSavingStatus.value = false
  }
}

const onDetailsBlur = async () => {
  const currentStatusDate = toProjectInputDate(props.document?.statusDate)
  const currentDescription = props.document?.description ?? ''

  if (statusDateInput.value === currentStatusDate && description.value === currentDescription) return

  isSavingDetails.value = true
  try {
    await saveStep({ statusDate: statusDateInput.value || undefined, description: description.value })
  } finally {
    isSavingDetails.value = false
  }
}

const onUploaded = () => {
  emit('saved')
}
</script>

<template>
  <div class="space-y-4 border-b border-slate-100 py-6 last:border-b-0">
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

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="État">
        <USelect
          :model-value="status"
          :items="statusOptions"
          value-attribute="value"
          option-attribute="label"
          :loading="isSavingStatus"
          class="w-full"
          @update:model-value="onStatusChange"
        />
      </UFormField>

      <UFormField :label="dateLabel">
        <UInput
          v-model="statusDateInput"
          type="date"
          class="w-full"
          @blur="onDetailsBlur"
        />
      </UFormField>
    </div>

    <UFormField label="Description">
      <UTextarea
        v-model="description"
        :rows="2"
        class="w-full"
        @blur="onDetailsBlur"
      />
    </UFormField>

    <UButton
      size="sm"
      variant="soft"
      color="neutral"
      icon="i-lucide-plus"
      :loading="isSavingDetails"
      @click="isUploadModalOpen = true"
    >
      Ajouter un document
    </UButton>

    <UploadModal
      v-model:open="isUploadModalOpen"
      :project-id="projectId"
      :document-type="documentType"
      :subtype="subtype"
      :title="`Ajouter un document — ${title}`"
      @uploaded="onUploaded"
    />
  </div>
</template>
