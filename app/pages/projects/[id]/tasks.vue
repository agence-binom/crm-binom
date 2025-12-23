<template>
  <div class="container mx-auto p-6">
    <!-- En-tête -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">
        Tâches - {{ data?.project.name }}
      </h1>
      <UBreadcrumb :items="breadcrumbItems" />
    </div>

    <!-- Actions -->
    <div class="flex justify-between items-center mb-6">
      <UButton
        icon="i-lucide-arrow-left"
        variant="soft"
        @click="navigateTo(`/clients/${data?.project.clientId}/projects`)"
      >
        Retour au projet
      </UButton>
      <UButton
        icon="i-lucide-plus"
        @click="showCreateModal = true"
      >
        Nouvelle tâche
      </UButton>
    </div>

    <!-- Statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-gray-600">
            {{ stats.total }}
          </div>
          <div class="text-sm text-gray-500">
            Total
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-yellow-600">
            {{ stats.todo }}
          </div>
          <div class="text-sm text-gray-500">
            À faire
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600">
            {{ stats.inProgress }}
          </div>
          <div class="text-sm text-gray-500">
            En cours
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600">
            {{ stats.done }}
          </div>
          <div class="text-sm text-gray-500">
            Terminées
          </div>
        </div>
      </UCard>
    </div>

    <!-- Liste des tâches par statut -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- À faire -->
      <div>
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <UIcon
            name="i-lucide-circle"
            class="text-yellow-500"
          />
          À faire ({{ tasksByStatus.todo.length }})
        </h3>
        <div class="space-y-3">
          <TaskCard
            v-for="task in tasksByStatus.todo"
            :key="task.id"
            :task="task"
            @update="onUpdateTask"
            @delete="onDeleteTask"
          />
          <div
            v-if="tasksByStatus.todo.length === 0"
            class="text-center py-8 text-gray-400"
          >
            Aucune tâche à faire
          </div>
        </div>
      </div>

      <!-- En cours -->
      <div>
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <UIcon
            name="i-lucide-loader"
            class="text-blue-500"
          />
          En cours ({{ tasksByStatus.in_progress.length }})
        </h3>
        <div class="space-y-3">
          <TaskCard
            v-for="task in tasksByStatus.in_progress"
            :key="task.id"
            :task="task"
            @update="onUpdateTask"
            @delete="onDeleteTask"
          />
          <div
            v-if="tasksByStatus.in_progress.length === 0"
            class="text-center py-8 text-gray-400"
          >
            Aucune tâche en cours
          </div>
        </div>
      </div>

      <!-- Terminées -->
      <div>
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <UIcon
            name="i-lucide-check-circle"
            class="text-green-500"
          />
          Terminées ({{ tasksByStatus.done.length }})
        </h3>
        <div class="space-y-3">
          <TaskCard
            v-for="task in tasksByStatus.done"
            :key="task.id"
            :task="task"
            @update="onUpdateTask"
            @delete="onDeleteTask"
          />
          <div
            v-if="tasksByStatus.done.length === 0"
            class="text-center py-8 text-gray-400"
          >
            Aucune tâche terminée
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de création -->
    <UModal v-model="showCreateModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            Nouvelle tâche
          </h3>
        </template>

        <UForm
          :schema="taskCreateSchema"
          :state="createFormState"
          @submit="onCreateTask"
        >
          <div class="space-y-4">
            <UFormField
              label="Titre *"
              name="title"
              required
            >
              <UInput
                v-model="createFormState.title"
                placeholder="Titre de la tâche"
              />
            </UFormField>

            <UFormField
              label="Description"
              name="description"
            >
              <UTextarea
                v-model="createFormState.description"
                placeholder="Description..."
                :rows="3"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="Priorité"
                name="priority"
              >
                <USelectMenu
                  v-model="createFormState.priority"
                  :options="priorityOptions"
                  value-attribute="value"
                  option-attribute="label"
                />
              </UFormField>

              <UFormField
                label="Date limite"
                name="dueDate"
              >
                <UInput
                  v-model="createFormState.dueDate"
                  type="date"
                />
              </UFormField>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-4">
            <UButton
              variant="soft"
              @click="showCreateModal = false"
            >
              Annuler
            </UButton>
            <UButton
              type="submit"
              :loading="isCreating"
            >
              Créer
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { taskCreateSchema, type TaskCreate } from '~/db/schema/validation'

const route = useRoute()
const projectId = computed(() => Number(route.params.id))

const { data, refresh } = await useFetch(`/api/projects/${projectId.value}/tasks`)

const showCreateModal = ref(false)
const isCreating = ref(false)

const createFormState = reactive({
  projectId: projectId.value,
  title: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  status: 'todo' as 'todo' | 'in_progress' | 'done',
  dueDate: ''
})

const priorityOptions = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' }
]

const breadcrumbItems = computed(() => [
  { label: 'Clients', to: '/clients' },
  { label: data.value?.project.name || '', to: `/clients/${data.value?.project.clientId}/projects` },
  { label: 'Tâches' }
])

const tasksByStatus = computed(() => {
  if (!data.value?.tasks) return { todo: [], in_progress: [], done: [] }

  return {
    todo: data.value.tasks.filter(t => t.status === 'todo'),
    in_progress: data.value.tasks.filter(t => t.status === 'in_progress'),
    done: data.value.tasks.filter(t => t.status === 'done')
  }
})

const stats = computed(() => ({
  total: data.value?.tasks.length || 0,
  todo: tasksByStatus.value.todo.length,
  inProgress: tasksByStatus.value.in_progress.length,
  done: tasksByStatus.value.done.length
}))

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
    await refresh()
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error)
  } finally {
    isCreating.value = false
  }
}

const onUpdateTask = async (taskId: number, updates: Record<string, unknown>) => {
  try {
    await $fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: updates
    })
    await refresh()
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error)
  }
}

const onDeleteTask = async (taskId: number) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return

  try {
    await $fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    })
    await refresh()
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error)
  }
}
</script>
