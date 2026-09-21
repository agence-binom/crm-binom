<script setup lang="ts">
import { sortByCreatedAtDesc, formatDate, formatDuration } from '~/lib/utils'
import type { TimeEntry } from '~/types'

type TimeEntryAssignee = { id: number, name: string }

const props = defineProps<{
  open: boolean
  timeEntries: TimeEntry[]
  taskId: number
  assignees?: TimeEntryAssignee[]
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'refresh': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isEditModalOpen = ref(false)
const selectedTimeEntryId = ref<number | null>(null)

const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()

const sortedTimeEntries = computed(() => sortByCreatedAtDesc(props.timeEntries))

const onSaved = () => emit('refresh')

const onDeleteTimeEntry = async (timeEntryId: number) => {
  await deleteResource('temps passé', timeEntryId, '/api/time-entries', async () => {
    emit('refresh')
  })
}

const openEditTimeEntry = (timeEntryId: number) => {
  selectedTimeEntryId.value = timeEntryId
  isEditModalOpen.value = true
}

const timeEntryToEdit = computed(() => {
  if (!selectedTimeEntryId.value) return null
  return props.timeEntries.find(entry => entry.id === selectedTimeEntryId.value) ?? null
})

const userName = (userId: number | null) => {
  if (!userId) return null
  return props.assignees?.find(assignee => assignee.id === userId)?.name ?? null
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Historique du temps passé"
    class="w-full max-w-2xl rounded-2xl"
  >
    <template #body>
      <div
        v-if="sortedTimeEntries.length"
        class="divide-y divide-slate-100 rounded-xl border border-slate-100"
      >
        <div
          v-for="entry in sortedTimeEntries"
          :key="entry.id"
          class="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-slate-900">
              {{ entry.notes || 'Sans description' }}
            </p>
            <p class="text-xs text-gray-500">
              {{ formatDuration(entry.duration) }}
              <template v-if="userName(entry.userId)">
                · {{ userName(entry.userId) }}
              </template>
              · {{ formatDate(entry.createdAt) }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <UButton
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="openEditTimeEntry(entry.id)"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="xs"
              @click="onDeleteTimeEntry(entry.id)"
            />
          </div>
        </div>
      </div>

      <AppEmptyState
        v-else
        variant="compact"
        icon="i-lucide-clock"
        title="Aucun temps loggé pour cette tâche"
      />
    </template>
  </UModal>

  <TimeEntriesModal
    v-model:open="isEditModalOpen"
    :task-id="taskId"
    :time-entry-id="selectedTimeEntryId"
    :time-entry="timeEntryToEdit"
    :assignees="assignees"
    @saved="onSaved"
  />

  <ConfirmModal
    :open="confirmModalOpen"
    title="Confirmer la suppression"
    :message="confirmModalMessage"
    @confirm="onConfirm"
    @cancel="onCancel"
  />
</template>
