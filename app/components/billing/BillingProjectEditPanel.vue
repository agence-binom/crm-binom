<script setup lang="ts">
import type { BillingProjectStatus } from '~/lib/billing'
import { getProjectDisplayStatus } from '~/lib/projects'
import { formatDateOnly } from '~/lib/utils'

const props = defineProps<{
  open: boolean
  project: BillingProjectStatus | null
}>()

const { getStatusColor, getStatusLabel } = useStatusHelpers()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saved': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const timelineRef = ref<{
  isDirty: boolean
  isSaving: boolean
  isEditingAnyStep: boolean
  onSave: () => Promise<void>
  onCancel: () => void
} | null>(null)
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
      <BillingStepsTimeline
        v-if="project"
        ref="timelineRef"
        :project-id="project.project.id"
        :requires-acompte="project.project.requiresAcompte"
        :active="open"
        orientation="vertical"
        :show-inline-actions="false"
        @saved="emit('saved')"
      />
    </template>

    <template
      v-if="timelineRef?.isDirty || timelineRef?.isEditingAnyStep"
      #footer
    >
      <div class="flex w-full items-center justify-end gap-3">
        <UButton
          variant="soft"
          color="neutral"
          :disabled="timelineRef?.isSaving"
          @click="timelineRef?.onCancel()"
        >
          Annuler
        </UButton>
        <UButton
          :loading="timelineRef?.isSaving"
          @click="timelineRef?.onSave()"
        >
          Enregistrer
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
