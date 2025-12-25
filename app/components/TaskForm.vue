<script setup lang="ts">
import { taskCreateSchema, type TaskCreate } from '~/validation/tasks'
import type { User } from '~/validation/users'
import type { Project } from '~/validation/projects'

const showCreateModal = ref(false)

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

const onCreateTask = async () => {
  isCreating.value = true

  try {
    const submitData: TaskCreate = {
      title: createFormState.title,
      notes: createFormState.notes,
      assignedTo: createFormState.assignedTo,
      dueDate: createFormState.dueDate ? new Date(createFormState.dueDate) : undefined
    }

    await $fetch('/api/tasks', {
      method: 'POST',
      body: submitData
    })

    showCreateModal.value = false
    Object.assign(createFormState, {
      title: '',
      description: '',
      dueDate: '',
      assignedTo: undefined
    })
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error)
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
  <UModal>
    <UButton
      icon="i-lucide-plus"
      @click="showCreateModal = true"
    >
      Ajouter une tâche
    </UButton>

    <template #content>
      <UCard>
        <template #header>
          <div class="flex justify-between">
            <h2 class="text-xl font-bold">
              Nouvelle tâche
            </h2>
            <UButton
              label="Fermer"
              icon="i-lucide-x"
              variant="solid"
              color="error"
              size="xs"
              @click="showCreateModal = false"
            />
          </div>
        </template>
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
            type="submit"
            :loading="isCreating"
          >
            Créer la tâche
          </UButton>
        </UForm>
      </UCard>
    </template>
  </UModal>
</template>
