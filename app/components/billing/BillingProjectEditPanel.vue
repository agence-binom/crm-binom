<script setup lang="ts">
import {
  billingDocumentTypeIcons,
  computeProjectBillingSteps,
  documentStatusBadgeColors,
  documentStatusLabels,
  getBillingStepActiveIndex,
  getBillingStepCategory,
  getBillingStepLabel,
  getForwardLineColors,
  type BillingDocumentType,
  type BillingStepKey,
  type DocumentLifecycle
} from '~/lib/documents'
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

type StepPalette = { icon?: string, indicator: string, line: string, titleClass: string }

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

// Recomputed client-side (rather than read from `project.billingSteps`) so toggling "Facture
// d'acompte requise" instantly re-cascades the pipeline, before that change is even saved.
const billingSteps = computed(() => computeProjectBillingSteps(documents.value, requiresAcompte.value))
const documentsById = computed(() => new Map(documents.value.map(document => [document.id, document])))

const isMuted = computed(() => props.project?.billingStatus.tone === 'muted')
const activeIndex = computed(() => getBillingStepActiveIndex(billingSteps.value))

const dateLabelByKey: Record<BillingStepKey, string> = {
  proposal: 'Date de signature',
  quote: 'Date de signature',
  acompte: 'Date de paiement',
  invoice: 'Date de règlement'
}

const palettes: Record<'completed' | 'sent' | 'negative' | 'active' | 'pending', StepPalette> = {
  completed: { icon: 'i-lucide-check', indicator: 'bg-success-500 text-white', line: 'bg-success-500', titleClass: 'font-semibold text-slate-900' },
  sent: { icon: 'i-lucide-hourglass', indicator: 'bg-warning-500 text-white', line: 'bg-warning-500', titleClass: 'font-semibold text-slate-900' },
  negative: { icon: 'i-lucide-x', indicator: 'bg-slate-100 text-slate-400', line: 'bg-slate-200', titleClass: 'text-slate-400 line-through' },
  active: { icon: 'i-lucide-circle', indicator: 'bg-info-500 text-white', line: 'bg-info-500', titleClass: 'font-semibold text-slate-900' },
  pending: { indicator: 'bg-slate-100 text-slate-300', line: 'bg-slate-200', titleClass: 'text-slate-400' }
}

const mutedPalette: Record<'completed' | 'other', StepPalette> = {
  completed: { icon: 'i-lucide-check', indicator: 'bg-slate-200 text-slate-400', line: 'bg-slate-200', titleClass: 'text-slate-400 font-semibold' },
  other: { icon: 'i-lucide-x', indicator: 'bg-slate-100 text-slate-400', line: 'bg-slate-200', titleClass: 'text-slate-400 line-through' }
}

// A step no longer applying to this project (acompte toggled off) reads as "already decided",
// like a skipped step - not "not reached yet" - so it gets its own lock reason and message.
const isAcompteNotRequired = (key: BillingStepKey) => key === 'acompte' && !requiresAcompte.value

const timelineItems = computed(() => {
  const nodes = billingSteps.value.map((step, index) => {
    const category = getBillingStepCategory(step, index, activeIndex.value, isMuted.value)
    const palette = isMuted.value
      ? (category === 'completed' ? mutedPalette.completed : mutedPalette.other)
      : palettes[category]

    const document = step.documentId ? documentsById.value.get(step.documentId) ?? null : null
    const locked = category === 'pending' || isAcompteNotRequired(step.key)

    return {
      value: step.key,
      step,
      category,
      icon: palette.icon ?? billingDocumentTypeIcons[step.documentType],
      title: getBillingStepLabel(step),
      dateLabel: dateLabelByKey[step.key],
      document,
      editable: !locked,
      lockedReason: isAcompteNotRequired(step.key) ? 'not-required' as const : 'pending' as const,
      ui: { indicator: palette.indicator, title: palette.titleClass, separator: undefined as string | undefined },
      line: palette.line,
      isSkipped: category === 'negative'
    }
  })

  const nextRealLine = getForwardLineColors(nodes)
  for (let index = 0; index < nodes.length - 1; index += 1) {
    nodes[index]!.ui.separator = nextRealLine[index + 1]
  }

  return nodes
})

const handleStepSaved = () => {
  loadDocuments()
  emit('saved')
}

// Each editable step starts as a read-only summary; "Modifier" swaps it for the form. There's no
// way back to the summary short of a global save or cancel, since collapsing the form would
// unmount it (and its in-progress edits) - not a soft "hide".
const editingKeys = ref(new Set<BillingStepKey>())
const isStepEditing = (key: BillingStepKey) => editingKeys.value.has(key)
const startEditingStep = (key: BillingStepKey) => editingKeys.value.add(key)
// Clicking "Modifier" is itself the commitment to the edit flow, so the footer's Annuler/
// Enregistrer show right away - not only once a field actually changes.
const isEditingAnyStep = computed(() => editingKeys.value.size > 0)

const editorRefsByKey = ref(new Map<BillingStepKey, StepEditorHandle>())
const setEditorRef = (key: BillingStepKey, el: StepEditorHandle | null) => {
  if (el) editorRefsByKey.value.set(key, el)
  else editorRefsByKey.value.delete(key)
}

const editorRefs = computed(() => [...editorRefsByKey.value.values()])

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
    editingKeys.value.clear()
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
  editingKeys.value.clear()
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
        class="group min-w-48 max-w-96"
      >
        <span class="truncate">{{ project?.project.name }}</span>
        <UBadge
          v-if="project"
          variant="soft"
          :color="getStatusColor(getProjectDisplayStatus(project.project))"
          class="rounded-full align-middle whitespace-nowrap"
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

      <UTimeline
        v-else-if="project"
        :items="timelineItems"
        orientation="vertical"
        size="lg"
        :class="{ 'pointer-events-none opacity-60': isSaving }"
      >
        <template #wrapper="{ item }">
          <div class="flex min-w-0 flex-1 items-center justify-between gap-2 pb-3">
            <h3 :class="['truncate text-sm', item.ui.title]">
              {{ item.title }}
            </h3>
            <div class="flex shrink-0 items-center gap-2">
              <UBadge
                variant="soft"
                size="sm"
                :color="documentStatusBadgeColors[item.step.status]"
                class="rounded-full"
              >
                {{ documentStatusLabels[item.step.documentType][item.step.status] }}
              </UBadge>
              <UButton
                v-if="item.editable && !isStepEditing(item.step.key)"
                variant="ghost"
                color="neutral"
                size="sm"
                icon="i-lucide-pencil"
                @click="startEditingStep(item.step.key)"
              >
                Modifier
              </UButton>
            </div>
          </div>

          <div
            v-if="item.step.key === 'quote'"
            class="mb-3 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
          >
            <span class="text-xs font-medium text-slate-600">Facture d'acompte requise</span>
            <USwitch v-model="requiresAcompte" />
          </div>

          <div :class="item.category === 'active' ? 'rounded-xl border border-info-100 bg-info-50/50 p-4' : ''">
            <BillingStepEditor
              v-if="item.editable && isStepEditing(item.step.key)"
              :ref="(el) => setEditorRef(item.step.key, el as StepEditorHandle | null)"
              :title="item.title"
              :project-id="project.project.id"
              :document-type="item.step.documentType"
              :subtype="item.step.subtype ?? undefined"
              :date-label="item.dateLabel"
              :document="item.document"
              :upload-disabled="isDirty"
              @saved="handleStepSaved"
            />
            <BillingStepSummary
              v-else-if="item.editable"
              :document-type="item.step.documentType"
              :subtype="item.step.subtype ?? undefined"
              :date-label="item.dateLabel"
              :document="item.document"
            />
            <div
              v-else
              class="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-3 text-xs text-slate-500"
            >
              <UIcon
                name="i-lucide-lock"
                class="size-3.5 shrink-0"
              />
              <span>{{ item.lockedReason === 'not-required' ? 'Facture d\'acompte non requise pour ce projet.' : 'Cette étape sera modifiable une fois les précédentes complétées.' }}</span>
            </div>
          </div>
        </template>
      </UTimeline>
    </template>

    <template
      v-if="isDirty || isEditingAnyStep"
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
