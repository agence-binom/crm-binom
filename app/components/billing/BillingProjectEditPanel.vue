<script setup lang="ts">
import { getEffectiveInvoiceSubtype, type BillingDocumentType, type DocumentLifecycle } from '~/lib/documents'
import type { BillingProjectStatus } from '~/lib/billing'
import { getProjectDisplayStatus } from '~/lib/projects'
import { formatDateOnly } from '~/lib/utils'
import type { BillingDocumentRecord } from '~/types'

type AnnotatedBillingDocument = BillingDocumentRecord & {
  type: BillingDocumentType
  lifecycle: DocumentLifecycle
  supersededByDocumentId: number | null
}

type StepEditorHandle = {
  isDirty: boolean
  save: () => Promise<void>
  reset: () => void
}

const props = defineProps<{
  open: boolean
  project: BillingProjectStatus | null
}>()

const { getStatusColor, getStatusLabel } = useStatusHelpers()
const { showError } = useFeedbackToast()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saved': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const documents = ref<AnnotatedBillingDocument[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const requiresAcompte = ref(true)

const loadDocuments = async () => {
  const projectId = props.project?.project.id
  if (!projectId) return

  isLoading.value = true
  try {
    const response = await $fetch<{ documents: AnnotatedBillingDocument[] }>(`/api/billing-documents/project/${projectId}`)
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

const findCurrentDocument = (predicate: (document: AnnotatedBillingDocument) => boolean) =>
  documents.value.find(document => document.lifecycle === 'current' && predicate(document)) ?? null

const proposalDocument = computed(() => findCurrentDocument(document => document.type === 'commercial_proposal'))
const quoteDocument = computed(() => findCurrentDocument(document => document.type === 'quote'))
const acompteDocument = computed(() => findCurrentDocument(document => getEffectiveInvoiceSubtype(document) === 'acompte'))
const invoiceDocument = computed(() => findCurrentDocument((document) => {
  const effectiveSubtype = getEffectiveInvoiceSubtype(document)
  return effectiveSubtype === 'unique' || effectiveSubtype === 'solde'
}))

const handleStepSaved = () => {
  loadDocuments()
  emit('saved')
}

// The toggle only stages a local change now — the actual PUT happens from onSave, alongside
// whichever step editors are also dirty, so everything commits (or fails) together.
const onRequiresAcompteChange = (value: boolean) => {
  requiresAcompte.value = value
}

const proposalEditorRef = ref<StepEditorHandle | null>(null)
const quoteEditorRef = ref<StepEditorHandle | null>(null)
const acompteEditorRef = ref<StepEditorHandle | null>(null)
const invoiceEditorRef = ref<StepEditorHandle | null>(null)

const editorRefs = computed(() => [
  proposalEditorRef.value,
  quoteEditorRef.value,
  acompteEditorRef.value,
  invoiceEditorRef.value
].filter((editor): editor is StepEditorHandle => editor !== null))

const isRequiresAcompteDirty = computed(() => requiresAcompte.value !== (props.project?.project.requiresAcompte ?? true))

const isDirty = computed(() => isRequiresAcompteDirty.value || editorRefs.value.some(editor => editor.isDirty))

const onSave = async () => {
  const projectId = props.project?.project.id
  if (!projectId) return

  isSaving.value = true
  try {
    const tasks = editorRefs.value.filter(editor => editor.isDirty).map(editor => editor.save())

    if (isRequiresAcompteDirty.value) {
      tasks.push($fetch(`/api/projects/${projectId}`, { method: 'PUT', body: { requiresAcompte: requiresAcompte.value } })
        .catch((error) => {
          showError('Échec de la mise à jour', error, 'Impossible de mettre à jour le besoin d\'acompte.')
          throw error
        }) as Promise<void>)
    }

    await Promise.all(tasks)
    await loadDocuments()
    emit('saved')
  } catch {
    // Each failed task already surfaced its own toast — nothing left to unwind changes still stand.
  } finally {
    isSaving.value = false
  }
}

const onCancel = () => {
  editorRefs.value.forEach(editor => editor.reset())
  requiresAcompte.value = props.project?.project.requiresAcompte ?? true
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
        :class="{ 'pointer-events-none opacity-60': isSaving }"
      >
        <BillingStepEditor
          ref="proposalEditorRef"
          title="Proposition commerciale"
          :project-id="project.project.id"
          document-type="commercial_proposal"
          date-label="Date de signature"
          :document="proposalDocument"
          :upload-disabled="isDirty"
          @saved="handleStepSaved"
        />
        <BillingStepEditor
          ref="quoteEditorRef"
          title="Devis"
          :project-id="project.project.id"
          document-type="quote"
          date-label="Date de signature"
          :document="quoteDocument"
          :requires-acompte="requiresAcompte"
          :upload-disabled="isDirty"
          @saved="handleStepSaved"
          @update:requires-acompte="onRequiresAcompteChange"
        />
        <BillingStepEditor
          v-if="requiresAcompte"
          ref="acompteEditorRef"
          title="Facture d'acompte"
          :project-id="project.project.id"
          document-type="invoice"
          subtype="acompte"
          date-label="Date de paiement"
          :document="acompteDocument"
          :upload-disabled="isDirty"
          @saved="handleStepSaved"
        />
        <BillingStepEditor
          ref="invoiceEditorRef"
          title="Facture"
          :project-id="project.project.id"
          document-type="invoice"
          :subtype="invoiceDocument ? getEffectiveInvoiceSubtype(invoiceDocument) ?? 'unique' : 'unique'"
          date-label="Date de règlement"
          :document="invoiceDocument"
          :upload-disabled="isDirty"
          @saved="handleStepSaved"
        />
      </div>
    </template>

    <template
      v-if="isDirty"
      #footer
    >
      <div class="flex w-full items-center justify-end gap-3">
        <UButton
          variant="soft"
          color="neutral"
          :disabled="isSaving"
          @click="onCancel"
        >
          Annuler
        </UButton>
        <UButton
          :loading="isSaving"
          @click="onSave"
        >
          Enregistrer
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
