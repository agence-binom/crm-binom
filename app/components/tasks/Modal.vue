<script setup lang="ts">
import { getLocalTimeZone, parseDate } from '@internationalized/date'
import type { TaskPriority, TaskStatus } from '~/constants/tasks'
import { taskPriorities, taskStatuses } from '~/constants/tasks'
import { formatDateOnly } from '~/lib/utils'
import {
  getTaskPriorityClass,
  getTaskPriorityIcon,
  getTaskPriorityLabel,
  getTaskStatusClass,
  getTaskStatusIcon,
  getTaskStatusLabel
} from '~/lib/tasks'
import type { Project, Task, TaskAttachment, User } from '~/types'

type TaskModalProjectOption = {
  id: number
  name: string
  clientName?: string | null
}

type EditableTaskField = 'title' | 'projectId' | 'dueDate' | 'priority' | 'status' | 'assignedTo' | 'notes'

// Un horodatage à minuit pile est traité comme "sans heure" : la donnée ne permet
// pas de distinguer une heure explicitement mise à 00:00 d'une date sans heure.
const splitDueDate = (dueDate: string | null | undefined) => {
  if (!dueDate) return { date: '', time: '' }
  const time = dueDate.slice(11, 16)
  return { date: dueDate.slice(0, 10), time: time !== '00:00' ? time : '' }
}

const props = defineProps<{
  open: boolean
  taskId?: number | null
  task?: Task | null
  projectId?: number | null
  projects?: TaskModalProjectOption[]
  users?: User[]
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saved': []
  'deleted': [taskId: number]
}>()
const { showError } = useFeedbackToast()
const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const draftTaskId = ref<number | null>(null)
const isCreatingDraft = ref(false)
const effectiveTaskId = computed(() => props.taskId ?? draftTaskId.value)

const taskStatusOptions = taskStatuses.map(status => ({
  label: getTaskStatusLabel(status),
  value: status,
  icon: getTaskStatusIcon(status)
}))
const taskPriorityOptions = taskPriorities.map(priority => ({
  label: getTaskPriorityLabel(priority),
  value: priority,
  icon: getTaskPriorityIcon(priority)
}))

const formState = reactive({
  title: '',
  notes: '',
  dueDate: '',
  dueTime: '',
  priority: 'low' as TaskPriority,
  status: 'todo' as TaskStatus,
  projectId: props.projectId ?? undefined as number | undefined,
  assignedTo: undefined as number | undefined
})

const selectedCalendarDate = computed({
  get: () => (formState.dueDate ? parseDate(formState.dueDate) : undefined),
  set: (value) => {
    formState.dueDate = value ? value.toString() : ''
    onDueDateChange()
  }
})

const formattedDueDate = computed(() =>
  selectedCalendarDate.value ? formatDateOnly(selectedCalendarDate.value.toDate(getLocalTimeZone())) : ''
)

const clearDueDate = () => {
  formState.dueDate = ''
  formState.dueTime = ''
  onDueDateChange()
}

const clearDueTime = () => {
  formState.dueTime = ''
  onDueDateChange()
}

const selectedProject = computed({
  get: () => projectsOptions.value.find(p => p.value === formState.projectId),
  set: (val) => { formState.projectId = val?.value }
})

const { data: projectData, refresh: refreshProjects } = await useFetch('/api/projects', {
  immediate: false
})
const projectsOptions = computed(() =>
  (props.projects ?? projectData.value?.projects ?? []).map((project: TaskModalProjectOption | Project) => ({
    label: 'clientName' in project && project.clientName
      ? `${project.name} · ${project.clientName}`
      : project.name,
    value: project.id,
    icon: 'i-lucide-briefcase-business'
  }))
)

const { data: usersData, refresh: refreshUsers } = await useFetch('/api/users', {
  immediate: false
})
const userOptions = computed(() =>
  (props.users ?? usersData.value?.users ?? []).map((user: User) => ({
    label: user.name,
    value: user.id
  }))
)
const assigneeOptions = computed(() => [
  { label: 'Non assigné', value: undefined as number | undefined, icon: 'i-lucide-user-round-x' },
  ...userOptions.value.map(user => ({
    label: user.label,
    value: user.value,
    icon: 'i-lucide-user-round'
  }))
])

const selectedAssignee = computed({
  get: () => assigneeOptions.value.find(option => option.value === formState.assignedTo),
  set: val => selectAssignee(val?.value)
})

const taskAttachments = ref<TaskAttachment[]>([])
const loadTaskAttachments = async () => {
  if (!effectiveTaskId.value) {
    taskAttachments.value = []
    return
  }

  const response = await $fetch('/api/task-attachments', { query: { taskId: effectiveTaskId.value } })
  taskAttachments.value = (response.attachments as TaskAttachment[] | undefined) || []
}

const resetForm = () => {
  Object.assign(formState, {
    title: '',
    notes: '',
    dueDate: '',
    dueTime: '',
    priority: 'low',
    status: 'todo',
    projectId: props.projectId ?? undefined,
    assignedTo: undefined
  })
}

// Dernière version confirmée par le serveur : sert de référence pour savoir
// si un champ a changé, et pour revenir en arrière si une sauvegarde échoue.
const lastKnownTask = ref<Task | null>(null)

const fillFromTask = (task: Task) => {
  lastKnownTask.value = task
  const { date: dueDate, time: dueTime } = splitDueDate(task.dueDate)
  Object.assign(formState, {
    title: task.title ?? '',
    notes: task.notes ?? '',
    status: task.status ?? 'todo',
    priority: task.priority ?? 'low',
    projectId: task.projectId ?? undefined,
    assignedTo: task.assignedTo ?? undefined,
    dueDate,
    dueTime
  })
}

const savingField = ref<EditableTaskField | null>(null)
const titleInput = useTemplateRef('titleInput')

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      draftTaskId.value = null
      lastKnownTask.value = null
      savingField.value = null
      return
    }

    if (props.taskId) {
      if (props.task) fillFromTask(props.task)
    } else {
      resetForm()
      isCreatingDraft.value = true
      try {
        const created = await $fetch<Task>('/api/tasks', {
          method: 'POST',
          body: { title: 'Sans titre', projectId: props.projectId ?? undefined }
        })
        draftTaskId.value = created.id
        fillFromTask(created)
        emit('saved')
        nextTick(() => titleInput.value?.inputRef?.focus())
      } catch (error) {
        console.error('Erreur lors de la création de la tâche:', error)
        showError('Création impossible', error, 'Impossible de créer la tâche.')
        isOpen.value = false
        return
      } finally {
        isCreatingDraft.value = false
      }
    }

    await Promise.all([
      props.projects === undefined && !projectData.value ? refreshProjects() : Promise.resolve(),
      props.users === undefined && !usersData.value ? refreshUsers() : Promise.resolve(),
      loadTaskAttachments()
    ])
  },
  { immediate: true }
)

watch(
  () => props.task,
  (task) => {
    if (!props.open || !props.taskId) return
    if (task) fillFromTask(task)
  }
)

const saveField = async (field: EditableTaskField, value: unknown) => {
  const taskId = effectiveTaskId.value
  if (!taskId) return

  if (value === undefined) return

  savingField.value = field
  try {
    const updated = await $fetch<Task>(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: { [field]: value }
    })
    lastKnownTask.value = updated
    emit('saved')
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde du champ "${field}":`, error)
    showError(
      'Enregistrement impossible',
      error,
      'Impossible de sauvegarder cette modification.'
    )
    if (lastKnownTask.value) fillFromTask(lastKnownTask.value)
  } finally {
    savingField.value = null
  }
}

const onTitleBlur = () => {
  const title = formState.title.trim()

  if (!title) {
    if (lastKnownTask.value) fillFromTask(lastKnownTask.value)
    return
  }

  if (title !== (lastKnownTask.value?.title ?? '')) saveField('title', title)
}

const onNotesBlur = () => {
  if (formState.notes !== (lastKnownTask.value?.notes ?? '')) saveField('notes', formState.notes)
}

const onDueDateChange = () => {
  const previous = splitDueDate(lastKnownTask.value?.dueDate)
  if (formState.dueDate === previous.date && formState.dueTime === previous.time) return

  const value = formState.dueDate ? `${formState.dueDate}T${formState.dueTime || '00:00'}:00.000Z` : null
  saveField('dueDate', value)
}

const selectProject = (value: number | undefined) => {
  formState.projectId = value
  saveField('projectId', value)
}

const selectPriority = (value: TaskPriority | undefined) => {
  if (!value) return
  formState.priority = value
  saveField('priority', value)
}

const selectStatus = (value: TaskStatus | undefined) => {
  if (!value) return
  formState.status = value
  saveField('status', value)
}

const selectAssignee = (value: number | undefined) => {
  formState.assignedTo = value
  saveField('assignedTo', value)
}

const onDeleteTask = async () => {
  const taskId = effectiveTaskId.value
  if (!taskId) return

  await deleteResource('tâche', taskId, '/api/tasks', () => {
    emit('deleted', taskId)
    isOpen.value = false
  })
}

const priorityChipUi = computed(() => ({
  base: `rounded-full ring-1 ring-inset px-2.5 py-1 text-xs font-medium transition-colors hover:brightness-95 aria-expanded:brightness-95 ${getTaskPriorityClass(formState.priority)}`,
  leadingIcon: 'text-current'
}))
const statusChipUi = computed(() => ({
  base: `rounded-full ring-1 ring-inset px-2.5 py-1 text-xs font-medium transition-colors hover:brightness-95 aria-expanded:brightness-95 ${getTaskStatusClass(formState.status)}`,
  leadingIcon: 'text-current',
  content: 'w-48'
}))
</script>

<template>
  <UModal
    v-model:open="isOpen"
    aria-describedby="Détail de la tâche"
    :close="{
      color: 'error',
      variant: 'solid',
      icon: 'i-lucide-x',
      size: 'xs',
      label: 'Fermer'
    }"
    class="w-full max-w-2xl rounded-2xl"
  >
    <template #title>
      <div class="flex items-center gap-2">
        <USelect
          :model-value="formState.status"
          :items="taskStatusOptions"
          :icon="getTaskStatusIcon(formState.status)"
          value-attribute="value"
          option-attribute="label"
          variant="none"
          size="sm"
          aria-label="Statut"
          :ui="statusChipUi"
          @update:model-value="value => selectStatus(value as TaskStatus)"
        />
        <USelect
          :model-value="formState.priority"
          :items="taskPriorityOptions"
          :icon="getTaskPriorityIcon(formState.priority)"
          value-attribute="value"
          option-attribute="label"
          variant="none"
          size="sm"
          aria-label="Priorité"
          :ui="priorityChipUi"
          @update:model-value="value => selectPriority(value as TaskPriority)"
        />
      </div>
    </template>

    <template #body>
      <div
        v-if="isCreatingDraft"
        class="flex justify-center py-16"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="animate-spin text-2xl text-slate-400"
        />
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <UInput
          ref="titleInput"
          v-model="formState.title"
          variant="none"
          fixed
          trailing-icon="i-lucide-pencil"
          aria-label="Titre de la tâche"
          class="w-full"
          :ui="{
            root: 'group',
            base: 'text-2xl font-semibold tracking-tight text-slate-900 -mx-2 px-2 py-1 rounded-lg ring-1 ring-transparent transition-colors group-hover:bg-slate-50 focus:bg-white focus:ring-slate-300',
            trailingIcon: 'opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 size-4'
          }"
          placeholder="Sans titre"
          @blur="onTitleBlur"
          @keydown.enter.prevent="($event.target as HTMLInputElement)?.blur()"
        />
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
            <USelectMenu
              v-model="selectedAssignee"
              :items="assigneeOptions"
              :icon="selectedAssignee?.icon"
              variant="none"
              size="sm"
              aria-label="Attribution"
              :ui="{
                base: 'rounded-full px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-transparent transition-colors hover:bg-slate-100 aria-expanded:bg-slate-100',
                leadingIcon: 'text-current'
              }"
            />
            <USelectMenu
              v-model="selectedProject"
              :items="projectsOptions"
              :icon="selectedProject ? 'i-lucide-briefcase-business' : 'i-lucide-circle-slash'"
              variant="none"
              size="sm"
              placeholder="Aucun projet"
              aria-label="Projet"
              :ui="{
                base: 'rounded-full px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-transparent transition-colors hover:bg-slate-100 aria-expanded:bg-slate-100',
                leadingIcon: 'text-current'
              }"
              @update:model-value="option => selectProject(option?.value)"
            />
          </div>
          <div class="flex flex-wrap items-center gap-1 border-b border-slate-100 pb-3">
            <TasksDuePillButton
              :icon="formState.dueDate ? 'i-lucide-calendar' : 'i-lucide-calendar-plus'"
              :label="formState.dueDate ? formattedDueDate : 'Ajouter une date'"
              :color="formState.dueDate ? 'info' : 'neutral'"
              :clear-label="formState.dueDate ? 'Retirer la date' : undefined"
              @clear="clearDueDate"
            >
              <UCalendar
                v-model="selectedCalendarDate"
                class="p-2"
              />
            </TasksDuePillButton>

            <TasksDuePillButton
              v-if="formState.dueDate"
              :icon="formState.dueTime ? 'i-lucide-clock' : 'i-lucide-clock-plus'"
              :label="formState.dueTime || 'Ajouter une heure'"
              :color="formState.dueTime ? 'info' : 'neutral'"
              :clear-label="formState.dueTime ? 'Retirer l\'heure' : undefined"
              @clear="clearDueTime"
            >
              <div class="p-3">
                <UInput
                  v-model="formState.dueTime"
                  type="time"
                  aria-label="Heure d'échéance"
                  @blur="onDueDateChange"
                />
              </div>
            </TasksDuePillButton>
          </div>
        </div>

        <UTextarea
          v-model="formState.notes"
          :rows="5"
          variant="none"
          trailing-icon="i-lucide-pencil"
          aria-label="Notes"
          class="w-full"
          :ui="{
            root: 'group',
            base: '-mx-2 px-2 py-1.5 rounded-lg text-sm text-slate-600 ring-1 ring-transparent transition-colors group-hover:bg-slate-50 focus:bg-white focus:ring-slate-300',
            trailingIcon: 'opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 size-4'
          }"
          placeholder="Ajouter une description..."
          @blur="onNotesBlur"
        />

        <div
          v-if="effectiveTaskId"
          class="border-t border-slate-100 pt-4"
        >
          <TaskAttachmentsList
            :attachments="taskAttachments"
            :task-id="effectiveTaskId"
            @refresh="loadTaskAttachments"
          />
        </div>

        <div class="flex items-center justify-between border-t border-slate-100 pt-4">
          <UButton
            variant="soft"
            color="error"
            icon="i-lucide-trash-2"
            @click="onDeleteTask"
          >
            Supprimer
          </UButton>
          <UButton
            variant="soft"
            color="neutral"
            @click="isOpen = false"
          >
            Fermer
          </UButton>
        </div>
      </div>
    </template>
  </UModal>

  <ConfirmModal
    :open="confirmModalOpen"
    title="Confirmer la suppression"
    :message="confirmModalMessage"
    @confirm="onConfirm"
    @cancel="onCancel"
  />
</template>
