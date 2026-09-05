import {
  applyStepSeparators,
  billingDocumentTypeIcons,
  billingStepPalettes,
  computeProjectBillingSteps,
  getBillingStatus,
  getBillingStepActiveIndex,
  getBillingStepCategory,
  getBillingStepLabel,
  mutedBillingStepPalette,
  type BillingDocumentType,
  type BillingStepCategory,
  type BillingStepKey,
  type DocumentLifecycle
} from '~/lib/documents'
import { formatDateOnly } from '~/lib/utils'
import type { BillingDocumentRecord } from '~/types'

export type AnnotatedBillingDocument = BillingDocumentRecord & {
  type: BillingDocumentType
  lifecycle: DocumentLifecycle
  supersededByDocumentId: number | null
}

export type StepEditorHandle = {
  isDirty: boolean
  save: () => Promise<void>
  reset: () => void
}

// The drawer's timeline sits at a larger size than the row-summary one (BillingRowTimeline), so
// its title reads a touch heavier for the categories that carry a title at all.
const emphasizedTitleClasses: Partial<Record<BillingStepCategory, string>> = {
  completed: 'font-semibold text-slate-900',
  sent: 'font-semibold text-slate-900',
  active: 'font-semibold text-slate-900'
}

const dateLabelByKey: Record<BillingStepKey, string> = {
  proposal: 'Date de signature',
  quote: 'Date de signature',
  acompte: 'Date de paiement',
  invoice: 'Date de règlement'
}

// Everything a "billing pipeline" timeline needs - documents, cascade, per-step categorization,
// which steps are unlocked, and the save/cancel flow - independent of how it's laid out
// (BillingProjectEditPanel uses it vertically in a drawer, the project page horizontally inline).
export function useBillingStepsEditor(options: {
  projectId: () => number | undefined
  requiresAcompteSource: () => boolean
  shouldLoad: () => boolean
  onSaved?: () => void
}) {
  const { showError } = useFeedbackToast()

  const documents = ref<AnnotatedBillingDocument[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const requiresAcompte = ref(options.requiresAcompteSource())

  const loadDocuments = async () => {
    const projectId = options.projectId()
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
    () => [options.shouldLoad(), options.projectId()] as const,
    ([shouldLoad]) => {
      if (shouldLoad) loadDocuments()
    },
    { immediate: true }
  )

  watch(
    () => options.requiresAcompteSource(),
    (value) => {
      requiresAcompte.value = value
    },
    { immediate: true }
  )

  // Recomputed client-side (rather than trusting a server-provided snapshot) so toggling "Facture
  // d'acompte requise" instantly re-cascades the pipeline, before that change is even saved.
  const billingSteps = computed(() => computeProjectBillingSteps(documents.value, requiresAcompte.value))
  const documentsById = computed(() => new Map(documents.value.map(document => [document.id, document])))

  const isMuted = computed(() => getBillingStatus(billingSteps.value).tone === 'muted')
  const activeIndex = computed(() => getBillingStepActiveIndex(billingSteps.value))

  // A step no longer applying to this project (acompte toggled off) reads as "already decided",
  // like a skipped step - not "not reached yet" - so it gets its own lock reason and message.
  const isAcompteNotRequired = (key: BillingStepKey) => key === 'acompte' && !requiresAcompte.value

  const timelineItems = computed(() => {
    const nodes = billingSteps.value.map((step, index) => {
      const category = getBillingStepCategory(step, index, activeIndex.value, isMuted.value)
      const palette = isMuted.value
        ? (category === 'completed' ? mutedBillingStepPalette.completed : mutedBillingStepPalette.other)
        : { ...billingStepPalettes[category], titleClass: emphasizedTitleClasses[category] ?? billingStepPalettes[category].titleClass }

      const document = step.documentId ? documentsById.value.get(step.documentId) ?? null : null
      const locked = category === 'pending' || isAcompteNotRequired(step.key)

      return {
        value: step.key,
        step,
        category,
        icon: palette.icon ?? billingDocumentTypeIcons[step.documentType],
        title: getBillingStepLabel(step),
        date: step.status === 'completed' ? formatDateOnly(document?.statusDate ?? document?.createdAt) : undefined,
        description: document?.description || undefined,
        dateLabel: dateLabelByKey[step.key],
        document,
        editable: !locked,
        lockedReason: isAcompteNotRequired(step.key) ? 'not-required' as const : 'pending' as const,
        ui: { indicator: palette.indicator, title: palette.titleClass, separator: undefined as string | undefined },
        line: palette.line,
        isSkipped: category === 'negative'
      }
    })

    return applyStepSeparators(nodes)
  })

  const handleStepSaved = () => {
    loadDocuments()
    options.onSaved?.()
  }

  // Each editable step starts as a read-only summary; "Modifier" swaps it for the form. There's no
  // way back to the summary short of a global save or cancel, since collapsing the form would
  // unmount it (and its in-progress edits) - not a soft "hide".
  const editingKeys = ref(new Set<BillingStepKey>())
  const isStepEditing = (key: BillingStepKey) => editingKeys.value.has(key)
  const startEditingStep = (key: BillingStepKey) => editingKeys.value.add(key)
  // Clicking "Modifier" is itself the commitment to the edit flow, so Annuler/Enregistrer show
  // right away - not only once a field actually changes.
  const isEditingAnyStep = computed(() => editingKeys.value.size > 0)

  const editorRefsByKey = ref(new Map<BillingStepKey, StepEditorHandle>())
  const setEditorRef = (key: BillingStepKey, el: StepEditorHandle | null) => {
    if (el) editorRefsByKey.value.set(key, el)
    else editorRefsByKey.value.delete(key)
  }

  const editorRefs = computed(() => [...editorRefsByKey.value.values()])

  const isRequiresAcompteDirty = computed(() => requiresAcompte.value !== options.requiresAcompteSource())

  const isDirty = computed(() => isRequiresAcompteDirty.value || editorRefs.value.some(editor => editor.isDirty))

  const onSave = async () => {
    const projectId = options.projectId()
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
      options.onSaved?.()
    } catch {
      // Each failed task already surfaced its own toast — nothing left to unwind changes still stand.
    } finally {
      isSaving.value = false
    }
  }

  const onCancel = () => {
    editorRefs.value.forEach(editor => editor.reset())
    requiresAcompte.value = options.requiresAcompteSource()
    editingKeys.value.clear()
  }

  return {
    isLoading,
    isSaving,
    requiresAcompte,
    timelineItems,
    isDirty,
    isEditingAnyStep,
    isStepEditing,
    startEditingStep,
    setEditorRef,
    handleStepSaved,
    onSave,
    onCancel
  }
}
