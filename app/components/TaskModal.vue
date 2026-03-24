<script setup lang="ts">
import { taskCreateSchema, taskUpdateSchema } from '~/validation/tasks'
import type { Project, Task, User } from '~/types'

type TaskModalProjectOption = {
  id: number
  name: string
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

const formState = reactive({
  title: '',
  notes: '',
  dueDate: '',
  status: 'todo' as 'todo' | 'in_progress' | 'done',
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
    label: project.name,
    value: project.id
  }))
)

const selectedUser = computed({
  get: () => userOptions.value.find(u => u.value === formState.assignedTo),
  set: (val) => { formState.assignedTo = val?.value }
})

const { data: usersData, refresh: refreshUsers } = await useFetch('/api/users', {
  immediate: false
})
const userOptions = computed(() =>
  (props.users ?? usersData.value?.users ?? []).map((user: User) => ({
    label: user.name,
    value: user.id
  }))
)

const resetForm = () => {
  Object.assign(formState, {
    title: '',
    notes: '',
    dueDate: '',
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
      status: formState.status,
      projectId: formState.projectId,
      assignedTo: formState.assignedTo,
      dueDate: formState.dueDate ? formState.dueDate : undefined
    }

    if (isEditing.value) {
      if (!props.taskId) throw new Error('taskId manquant pour la mise à jour')
      await $fetch(`/api/tasks/${props.taskId}`, { method: 'PUT', body })
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
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Titre de la tâche"
          name="title"
        >
          <UInput
            v-model="formState.title"
            class="w-full"
          />
        </UFormField>

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
          label="Assigner à"
          name="assignedTo"
        >
          <USelectMenu
            v-model="selectedUser"
            :items="userOptions"
            placeholder="Sélectionner un utilisateur"
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

        <UFormField
          label="Notes"
          name="notes"
        >
          <UTextarea
            v-model="formState.notes"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
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
      </UForm>
    </template>
  </UModal>
</template>
