<script setup lang="ts">
import { taskCreateSchema, taskUpdateSchema } from '~/validation/tasks'
import type { Task } from '~/validation/tasks'
import type { User } from '~/validation/users'
import type { Project } from '~/validation/projects'

const props = defineProps<{
  open: boolean
  taskId?: number | null
  task?: Task | null
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saved': []
}>()

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
  projectId: undefined as number | undefined,
  assignedTo: undefined as number | undefined
})

const { data: userData } = await useFetch('/api/users')
const userOptions = computed(() =>
  userData.value?.users?.map((user: User) => ({
    label: user.name,
    value: user.id
  })) ?? []
)

const { data: projectData } = await useFetch('/api/projects')
const projectsOptions = computed(() =>
  projectData.value?.projects?.map((project: Project) => ({
    label: project.name,
    value: project.id
  })) ?? []
)

const resetForm = () => {
  Object.assign(formState, {
    title: '',
    notes: '',
    dueDate: '',
    projectId: undefined,
    assignedTo: undefined
  })
}

const fillFromTask = (task: Task) => {
  Object.assign(formState, {
    title: task.title ?? '',
    notes: task.notes ?? '',
    projectId: task.projectId ?? undefined,
    assignedTo: task.assignedTo ?? undefined,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ''
  })
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
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
          <USelect
            v-model="formState.projectId"
            :items="projectsOptions"
            placeholder="Sélectionner un projet"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Assigner à"
          name="assignedTo"
        >
          <USelect
            v-model="formState.assignedTo"
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

        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="ghost"
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
