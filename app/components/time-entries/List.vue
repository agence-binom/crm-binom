<script setup lang="ts">
import { formatDuration } from '~/lib/utils'
import type { TimeEntry } from '~/types'

type TimeEntryAssignee = { id: number, name: string }

const props = defineProps<{
  timeEntries: TimeEntry[]
  taskId: number
  assignees?: TimeEntryAssignee[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

const isCreateModalOpen = ref(false)
const isHistoryModalOpen = ref(false)

const totalDuration = computed(() => props.timeEntries.reduce((sum, entry) => sum + entry.duration, 0))

const onSaved = () => emit('refresh')
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <div>
      <p class="text-sm font-medium text-slate-900">
        Temps passé : {{ formatDuration(totalDuration) }}
      </p>
      <button
        v-if="timeEntries.length"
        type="button"
        class="text-xs text-slate-500 underline decoration-dotted underline-offset-2 hover:text-slate-700"
        @click="isHistoryModalOpen = true"
      >
        Voir l'historique
      </button>
    </div>
    <UButton
      icon="i-lucide-plus"
      variant="soft"
      color="neutral"
      size="xs"
      @click="isCreateModalOpen = true"
    >
      Ajouter du temps
    </UButton>
  </div>

  <TimeEntriesModal
    v-model:open="isCreateModalOpen"
    :task-id="taskId"
    :assignees="assignees"
    @saved="onSaved"
  />

  <TimeEntriesHistoryModal
    v-model:open="isHistoryModalOpen"
    :time-entries="timeEntries"
    :task-id="taskId"
    :assignees="assignees"
    @refresh="onSaved"
  />
</template>
