<script setup lang="ts">
import { sortByCreatedAtDesc, formatDate, formatDuration, sumDurations } from '~/lib/utils'
import type { Task, TimeEntry } from '~/types'

type TimeEntryAssignee = { id: number, name: string }

const props = defineProps<{
  open: boolean
  timeEntries: (TimeEntry & { taskTitle?: string | null })[]
  taskId?: number | null
  projectId?: number | null
  // Fourni uniquement pour l'historique d'un projet : titre de tâche par ligne, total et ajout.
  tasks?: Pick<Task, 'id' | 'title'>[]
  assignees?: TimeEntryAssignee[]
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'refresh': []
  'add': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isEditModalOpen = ref(false)
const selectedTimeEntryId = ref<number | null>(null)

const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()

const isProjectHistory = computed(() => Boolean(props.tasks))
const sortedTimeEntries = computed(() => sortByCreatedAtDesc(props.timeEntries))
const totalDuration = computed(() => sumDurations(props.timeEntries))

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
    :title="isProjectHistory ? 'Historique du temps passé sur le projet' : 'Historique du temps passé'"
    class="w-full max-w-2xl rounded-2xl"
  >
    <template #body>
      <template v-if="sortedTimeEntries.length">
        <div
          v-if="isProjectHistory"
          class="mb-4 flex items-center justify-between gap-4"
        >
          <p class="text-sm font-medium text-slate-900 tabular-nums">
            Total : {{ formatDuration(totalDuration) }}
          </p>
          <UButton
            icon="i-lucide-plus"
            variant="soft"
            color="neutral"
            size="xs"
            @click="emit('add')"
          >
            Ajouter du temps
          </UButton>
        </div>

        <div class="divide-y divide-slate-100 rounded-xl border border-slate-100">
          <div
            v-for="entry in sortedTimeEntries"
            :key="entry.id"
            class="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div class="min-w-0">
              <template v-if="isProjectHistory">
                <p class="truncate text-sm font-medium text-slate-900">
                  {{ entry.taskTitle ?? 'Projet (sans tâche)' }}
                </p>
                <p
                  v-if="entry.notes"
                  class="truncate text-sm text-slate-600"
                >
                  {{ entry.notes }}
                </p>
              </template>
              <p
                v-else
                class="truncate text-sm font-medium text-slate-900"
              >
                {{ entry.notes || 'Sans description' }}
              </p>
              <p class="text-xs text-gray-500">
                <template v-if="userName(entry.userId)">
                  {{ userName(entry.userId) }} ·
                </template>
                {{ formatDate(entry.createdAt) }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <span class="mr-2 rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-900 tabular-nums">
                {{ formatDuration(entry.duration) }}
              </span>
              <UButton
                icon="i-lucide-pencil"
                variant="ghost"
                color="neutral"
                size="xs"
                aria-label="Modifier le temps passé"
                @click="openEditTimeEntry(entry.id)"
              />
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                color="error"
                size="xs"
                aria-label="Supprimer le temps passé"
                @click="onDeleteTimeEntry(entry.id)"
              />
            </div>
          </div>
        </div>
      </template>

      <AppEmptyState
        v-else
        variant="compact"
        icon="i-lucide-timer"
        :title="isProjectHistory ? 'Aucun temps loggé sur ce projet' : 'Aucun temps loggé pour cette tâche'"
      >
        <template
          v-if="isProjectHistory"
          #actions
        >
          <UButton
            icon="i-lucide-plus"
            variant="soft"
            color="neutral"
            size="sm"
            @click="emit('add')"
          >
            Ajouter du temps
          </UButton>
        </template>
      </AppEmptyState>
    </template>
  </UModal>

  <TimeEntriesModal
    v-model:open="isEditModalOpen"
    :task-id="timeEntryToEdit?.taskId ?? taskId"
    :project-id="projectId"
    :tasks="tasks"
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
