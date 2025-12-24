<script setup lang="ts">
import { taskCreateSchema, type TaskCreate } from '~/validation/tasks'

const showCreateModal = ref(false)

const isCreating = ref(false)
const createFormState = reactive({
  title: '',
  description: '',
  dueDate: ''
})

const onCreateTask = async () => {
  isCreating.value = true

  try {
    const submitData: TaskCreate = {
      ...createFormState,
      dueDate: createFormState.dueDate ? new Date(createFormState.dueDate) : undefined
    }

    await $fetch('/api/tasks', {
      method: 'POST',
      body: submitData
    })

    showCreateModal.value = false
    createFormState.title = ''
    createFormState.description = ''
    createFormState.dueDate = ''
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
      Nouvelle tâche
    </UButton>

    <template #content>
      <UCard>
        <template #header>
          <h2 class="text-xl font-bold">
            Créer une nouvelle tâche
          </h2>
        </template>
        <UForm
          :schema="taskCreateSchema"
          :state="createFormState"
          class="space-y-4"
          @submit="onCreateTask"
        >
          <UFormField
            label="Titre"
            name="title"
          >
            <UInput v-model="createFormState.title" />
          </UFormField>

          <UFormField
            label="Description"
            name="description"
          >
            <UInput
              v-model="createFormState.description"
              type="text"
            />
          </UFormField>
          <UFormField
            label="Due Date"
            name="dueDate"
          >
            <UInput
              v-model="createFormState.dueDate"
              type="date"
            />
          </UFormField>
          <UButton
            type="submit"
          >
            Submit
          </UButton>
        </UForm>
      </UCard>
    </template>
  </UModal>
</template>
