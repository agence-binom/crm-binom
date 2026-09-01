<script setup lang="ts">
import { annotateDocumentLifecycle, getEffectiveInvoiceSubtype, type BillingDocumentType } from '~/lib/documents'
import type { BillingProjectStatus } from '~/lib/billing'
import { getProjectDisplayStatus } from '~/lib/projects'
import { formatDateOnly } from '~/lib/utils'
import type { BillingDocumentRecord } from '~/types'

const props = defineProps<{
  open: boolean
  project: BillingProjectStatus | null
}>()

const { getStatusColor, getStatusLabel } = useStatusHelpers()
const { showError } = useFeedbackToast()

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const documents = ref<BillingDocumentRecord[]>([])
const isLoading = ref(false)
const requiresAcompte = ref(true)
const isSavingRequiresAcompte = ref(false)

const loadDocuments = async () => {
  const projectId = props.project?.project.id
  if (!projectId) return

  isLoading.value = true
  try {
    const response = await $fetch<{ documents: BillingDocumentRecord[] }>(`/api/billing-documents/project/${projectId}`)
    documents.value = response.documents
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [props.open, props.project?.project.id] as const,
  ([open]) => {
    if (open) loadDocuments()
  },
  { immediate: true }
)

watch(
  () => props.project?.project.requiresAcompte,
  (value) => {
    requiresAcompte.value = value ?? true
  },
  { immediate: true }
)

const annotatedDocuments = computed(() => annotateDocumentLifecycle(
  documents.value.map(document => ({ ...document, type: document.documentType as BillingDocumentType }))
))

const findCurrentDocument = (predicate: (document: typeof annotatedDocuments.value[number]) => boolean) =>
  annotatedDocuments.value.find(document => document.lifecycle === 'current' && predicate(document)) ?? null

const proposalDocument = computed(() => findCurrentDocument(document => document.type === 'commercial_proposal'))
const quoteDocument = computed(() => findCurrentDocument(document => document.type === 'quote'))
const acompteDocument = computed(() => findCurrentDocument(document => getEffectiveInvoiceSubtype(document) === 'acompte'))
const invoiceDocument = computed(() => findCurrentDocument((document) => {
  const effectiveSubtype = getEffectiveInvoiceSubtype(document)
  return effectiveSubtype === 'unique' || effectiveSubtype === 'solde'
}))

const handleStepSaved = () => {
  loadDocuments()
}

const onRequiresAcompteChange = async (value: boolean) => {
  const projectId = props.project?.project.id
  if (!projectId || value === requiresAcompte.value) return

  requiresAcompte.value = value
  isSavingRequiresAcompte.value = true
  try {
    await $fetch(`/api/projects/${projectId}`, { method: 'PUT', body: { requiresAcompte: value } })
  } catch (error) {
    requiresAcompte.value = !value
    showError('Échec de la mise à jour', error, 'Impossible de mettre à jour le besoin d\'acompte.')
  } finally {
    isSavingRequiresAcompte.value = false
  }
}
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    side="right"
    class="w-full max-w-xl"
  >
    <template #title>
      <AppLink
        :to="`/clients/${project?.project.clientId}/projects/${project?.project.id}`"
        class="group min-w-48"
      >
        <span>{{ project?.project.name }}</span>
        <UBadge
          v-if="project"
          variant="soft"
          :color="getStatusColor(getProjectDisplayStatus(project.project))"
          class="rounded-full align-middle"
        >
          {{ getStatusLabel(getProjectDisplayStatus(project.project)) }}
        </UBadge>
      </AppLink>
    </template>
    <template #description>
      <div class="space-y-2">
        <NuxtLink
          :to="`/clients/${project?.project.client.id}`"
          class="inline-flex max-w-full items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100"
        >
          <UIcon
            name="i-lucide-building-2"
            class="shrink-0"
          />
          <span class="truncate">{{ project?.project.client.name }}</span>
        </NuxtLink>
        <p
          v-if="project?.project.startDate || project?.project.endDate"
          class="text-xs text-slate-400"
        >
          {{ formatDateOnly(project?.project.startDate) }} → {{ formatDateOnly(project?.project.endDate) }}
        </p>
      </div>
    </template>

    <template #body>
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-12 text-sm text-slate-500"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="mr-2 animate-spin"
        />
        Chargement des documents...
      </div>

      <div
        v-else-if="project"
        :class="{ 'pointer-events-none opacity-60': isSavingRequiresAcompte }"
      >
        <BillingStepEditor
          title="Proposition commerciale"
          :project-id="project.project.id"
          document-type="commercial_proposal"
          date-label="Date de signature"
          :document="proposalDocument"
          @saved="handleStepSaved"
        />
        <BillingStepEditor
          title="Devis"
          :project-id="project.project.id"
          document-type="quote"
          date-label="Date de signature"
          :document="quoteDocument"
          :requires-acompte="requiresAcompte"
          @saved="handleStepSaved"
          @update:requires-acompte="onRequiresAcompteChange"
        />
        <BillingStepEditor
          title="Facture d'acompte"
          :project-id="project.project.id"
          document-type="invoice"
          subtype="acompte"
          date-label="Date de paiement"
          :document="acompteDocument"
          @saved="handleStepSaved"
        />
        <BillingStepEditor
          title="Facture"
          :project-id="project.project.id"
          document-type="invoice"
          :subtype="invoiceDocument ? getEffectiveInvoiceSubtype(invoiceDocument) ?? 'unique' : 'unique'"
          date-label="Date de règlement"
          :document="invoiceDocument"
          @saved="handleStepSaved"
        />
      </div>
    </template>
  </USlideover>
</template>
