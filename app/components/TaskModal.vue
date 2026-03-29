<script setup lang="ts">
import type { TaskPriority, TaskStatus } from '~/constants/tasks'
import { taskPriorities, taskStatuses } from '~/constants/tasks'
import {
  getTaskPriorityClass,
  getTaskPriorityIcon,
  getTaskPriorityLabel,
  getTaskStatusLabel
} from '~/lib/tasks'
import { taskCreateSchema, taskUpdateSchema } from '~/validation/tasks'
import type { Project, Task, User } from '~/types'

type TaskModalProjectOption = {
  id: number
  name: string
  clientName?: string | null
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
}>()
const { showError } = useFeedbackToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isSaving = ref(false)
const isEditing = computed(() => props.taskId != null)

const schema = computed(() => (isEditing.value ? taskUpdateSchema : taskCreateSchema))
const modalTitle = computed(() => (isEditing.value ? 'Modifier la tâche' : 'Nouvelle tâche'))
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : 'Créer la tâche'))
const taskStatusOptions = taskStatuses.map(status => ({
  label: getTaskStatusLabel(status),
  value: status
}))
const taskPriorityOptions = taskPriorities.map(priority => ({
  label: getTaskPriorityLabel(priority),
  value: priority
}))

const formState = reactive({
  title: '',
  notes: '',
  dueDate: '',
  priority: 'low' as TaskPriority,
  status: 'todo' as TaskStatus,
  projectId: props.projectId ?? undefined as number | undefined,
  assignedTo: undefined as number | undefined
})

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
    value: project.id
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

const resetForm = () => {
  Object.assign(formState, {
    title: '',
    notes: '',
    dueDate: '',
    priority: 'low',
    status: 'todo',
    projectId: props.projectId ?? undefined,
    assignedTo: undefined
  })
}

const fillFromTask = (task: Task) => {
  Object.assign(formState, {
    title: task.title ?? '',
    notes: task.notes ?? '',
    status: task.status ?? 'todo',
    priority: task.priority ?? 'low',
    projectId: task.projectId ?? undefined,
    assignedTo: task.assignedTo ?? undefined,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ''
  })
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return

    await Promise.all([
      props.projects === undefined && !projectData.value ? refreshProjects() : Promise.resolve(),
      props.users === undefined && !usersData.value ? refreshUsers() : Promise.resolve()
    ])

    if (isEditing.value && props.task) fillFromTask(props.task)
    else resetForm()
  },
  { immediate: true }
)

watch(
  () => props.task,
  (task) => {
    if (!props.open) return
    if (isEditing.value && task) fillFromTask(task)
  }
)

const onSubmit = async () => {
  isSaving.value = true
  try {
    const body = {
      title: formState.title,
      notes: formState.notes,
      priority: formState.priority,
      projectId: formState.projectId,
      assignedTo: formState.assignedTo,
      dueDate: formState.dueDate ? formState.dueDate : undefined
    }

    if (isEditing.value) {
      if (!props.taskId) throw new Error('taskId manquant pour la mise à jour')
      await $fetch(`/api/tasks/${props.taskId}`, {
        method: 'PUT',
        body: {
          ...body,
          status: formState.status
        }
      })
    } else {
      await $fetch('/api/tasks', { method: 'POST', body })
    }

    emit('saved')
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la tâche:', error)
    showError(
      'Enregistrement impossible',
      error,
      'Impossible de sauvegarder la tâche.'
    )
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    :aria-describedby="isEditing ? 'Modifier les informations de la tâche' : 'Créer une nouvelle tâche'"
    :close="{
      color: 'error',
      variant: 'solid',
      icon: 'i-lucide-x',
      size: 'xs',
      label: 'Fermer'
    }"
    class="w-full max-w-3xl"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="formState"
        class="space-y-5"
        @submit="onSubmit"
      >
        <div class="space-y-6">
          <UFormField
            label="Titre"
            name="title"
          >
            <UInput
              v-model="formState.title"
              class="w-full"
              placeholder="Ex: Finaliser la maquette mobile"
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
            <UFormField
              label="Projet"
              name="projectId"
            >
              <USelectMenu
                v-model="selectedProject"
                :items="projectsOptions"
                placeholder="Sélectionner un projet"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Date d'échéance"
              name="dueDate"
            >
              <UInput
                v-model="formState.dueDate"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="space-y-2.5">
            <p class="text-sm font-medium text-slate-700">
              Priorité
            </p>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="priority in taskPriorityOptions"
                :key="priority.value"
                type="button"
                variant="soft"
                color="neutral"
                :class="[
                  'rounded-full px-3.5 transition-colors',
                  formState.priority === priority.value
                    ? getTaskPriorityClass(priority.value)
                    : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-200/70'
                ]"
                @click="formState.priority = priority.value"
              >
                <UIcon
                  :name="getTaskPriorityIcon(priority.value)"
                  class="mr-1"
                />
                {{ priority.label }}
              </UButton>
            </div>
          </div>

          <div class="space-y-2.5">
            <p class="text-sm font-medium text-slate-700">
              Attribution
            </p>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="option in assigneeOptions"
                :key="option.label"
                type="button"
                variant="soft"
                color="neutral"
                :class="[
                  'rounded-full px-3.5 transition-colors',
                  formState.assignedTo === option.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-200/70'
                ]"
                @click="formState.assignedTo = option.value"
              >
                <UIcon
                  :name="option.icon"
                  class="mr-1"
                />
                {{ option.label }}
              </UButton>
            </div>
          </div>

          <div
            v-if="isEditing"
            class="grid gap-4 sm:grid-cols-1"
          >
            <UFormField
              label="Statut"
              name="status"
            >
              <USelect
                v-model="formState.status"
                :items="taskStatusOptions"
                value-attribute="value"
                option-attribute="label"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            label="Notes"
            name="notes"
          >
            <UTextarea
              v-model="formState.notes"
              :rows="6"
              class="w-full"
              placeholder="Contexte, points d'attention, prochaines étapes..."
            />
          </UFormField>

          <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <UButton
              variant="soft"
              color="neutral"
              :disabled="isSaving"
              @click="isOpen = false"
            >
              Annuler
            </UButton>
            <UButton
              type="submit"
              :loading="isSaving"
            >
              {{ submitLabel }}
            </UButton>
          </div>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
