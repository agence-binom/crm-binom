<script setup lang="ts">
import { taskCreateSchema, type TaskCreate } from '~/validation/tasks'
import type { User } from '~/validation/users'
import type { Project } from '~/validation/projects'

const emit = defineEmits<{
  taskCreated: []
}>()

const isOpen = ref(false)

const isCreating = ref(false)

const createFormState = reactive({
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
  })) || []
)

const { data: projectData } = await useFetch('/api/projects')

const projectsOptions = computed(() =>
  projectData.value?.projects?.map((project: Project) => ({
    label: project.name,
    value: project.id
  })) || []
)

const resetForm = () => {
  Object.assign(createFormState, {
    title: '',
    notes: '',
    dueDate: '',
    projectId: undefined,
    assignedTo: undefined
  })
}

const onCreateTask = async () => {
  isCreating.value = true

  try {
    const submitData: TaskCreate = {
      title: createFormState.title,
      notes: createFormState.notes,
      projectId: createFormState.projectId,
      assignedTo: createFormState.assignedTo
    }

    await $fetch('/api/tasks', {
      method: 'POST',
      body: submitData
    })

    resetForm()
    isOpen.value = false
    emit('taskCreated')
  } catch (error) {
    console.error('❌ ERREUR CAPTURÉE:', error)
  } finally {
    isCreating.value = false
  }
}

// const onUpdateTask = async (taskId: number, updates: Record<string, unknown>) => {
//   try {
//     await $fetch(`/api/tasks/${taskId}`, {
//       method: 'PUT',
//       body: updates
//     })
//     await refresh()
//   } catch (error) {
//     console.error('Erreur lors de la mise à jour de la tâche:', error)
//   }
// }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Nouvelle tâche"

    :close="{
      color: 'error',
      variant: 'solid',
      icon: 'i-lucide-x',
      size: 'xs',
      label: 'Fermer'
    }"
  >
    <UButton
      icon="i-lucide-plus"
    >
      Ajouter une tâche
    </UButton>

    <template #body>
      <UForm
        :schema="taskCreateSchema"
        :state="createFormState"
        class="space-y-4"
        @submit="onCreateTask"
      >
        <UFormField
          label="Titre de la tâche"
          name="title"
        >
          <UInput
            v-model="createFormState.title"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Projet"
          name="projectId"
        >
          <USelect
            v-model="createFormState.projectId"
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
            v-model="createFormState.assignedTo"
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
            v-model="createFormState.dueDate"
            type="date"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Notes"
          name="notes"
        >
          <UTextarea
            v-model="createFormState.notes"
            :rows="3"
            class="w-full"
          />
        </UFormField>
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="isCreating"
          @click="isOpen = false"
        >
          Annuler
        </UButton>
        <UButton
          type="submit"
          :loading="isCreating"
        >
          Créer la tâche
        </UButton>
      </UForm>
    </template>
  </UModal>
</template>
