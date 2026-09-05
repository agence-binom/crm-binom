<script setup lang="ts">
import { documentStatusBadgeColors, documentStatusLabels } from '~/lib/documents'
import { useBillingStepsEditor, type StepEditorHandle } from '~/composables/useBillingStepsEditor'

const props = withDefaults(defineProps<{
  projectId: number | undefined
  requiresAcompte: boolean
  orientation?: 'vertical' | 'horizontal'
  /** Whether this instance is currently visible/relevant enough to fetch documents (e.g. a drawer's open state). */
  active?: boolean
  /** Render its own Annuler/Enregistrer bar. Set to false when the parent drives save/cancel itself (e.g. a slideover footer) via the exposed methods. */
  showInlineActions?: boolean
}>(), {
  orientation: 'vertical',
  active: true,
  showInlineActions: true
})

const emit = defineEmits<{
  saved: []
}>()

const {
  isLoading,
  isSaving,
  requiresAcompte: stagedRequiresAcompte,
  timelineItems,
  isDirty,
  isEditingAnyStep,
  isStepEditing,
  startEditingStep,
  setEditorRef,
  handleStepSaved,
  onSave,
  onCancel
} = useBillingStepsEditor({
  projectId: () => props.projectId,
  requiresAcompteSource: () => props.requiresAcompte,
  shouldLoad: () => props.active,
  onSaved: () => emit('saved')
})

defineExpose({ isDirty, isSaving, isEditingAnyStep, onSave, onCancel })
</script>

<template>
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
    v-else
    :class="orientation === 'horizontal' ? 'overflow-x-auto pb-2' : ''"
  >
    <UTimeline
      :items="timelineItems"
      :orientation="orientation"
      size="lg"
      :ui="orientation === 'horizontal' ? { item: 'flex-none', wrapper: 'w-80' } : undefined"
      :class="[orientation === 'horizontal' ? 'min-w-max' : '', { 'pointer-events-none opacity-60': isSaving }]"
    >
      <template #wrapper="{ item }">
        <div class="pb-3">
          <div class="flex min-w-0 items-center justify-between gap-2">
            <div class="min-w-0">
              <p
                v-if="item.date"
                class="text-xs text-slate-400"
              >
                {{ item.date }}
              </p>
              <h3 :class="['truncate text-sm', item.ui.title]">
                {{ item.title }}
              </h3>
            </div>
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
              />
            </div>
          </div>

          <p
            v-if="item.description"
            class="mt-1 text-xs text-slate-400"
          >
            {{ item.description }}
          </p>
        </div>

        <div
          v-if="item.step.key === 'quote'"
          class="mb-3 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
        >
          <span class="text-xs font-medium text-slate-600">Facture d'acompte requise</span>
          <USwitch v-model="stagedRequiresAcompte" />
        </div>

        <div :class="item.category === 'active' ? 'rounded-xl border border-info-100 bg-info-50/50 p-4' : ''">
          <BillingStepEditor
            v-if="item.editable && isStepEditing(item.step.key)"
            :ref="(el) => setEditorRef(item.step.key, el as StepEditorHandle | null)"
            :title="item.title"
            :project-id="projectId!"
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
  </div>

  <div
    v-if="showInlineActions && (isDirty || isEditingAnyStep)"
    class="mt-4 flex items-center justify-end gap-3 border-t border-slate-200 pt-4"
  >
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
