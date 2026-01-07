<script setup lang="ts">
import type { User } from '~/validation/users'

const { data, refresh } = await useFetch('/api/tasks')

const isTaskModalOpen = ref(false)
const selectedTaskId = ref<number | null>(null)
const selectedUserId = ref<number | null>(null)

const selectedUser = computed({
  get: () => userOptions.value.find(u => u.value === selectedUserId.value),
  set: (val) => { selectedUserId.value = val?.value ?? null }
})

const { data: usersData } = await useFetch('/api/users')
const userOptions = computed(() => {
  const options: { label: string, value: number | null }[] = [{ label: 'Tous les utilisateurs', value: null }]
  options.push(...usersData.value?.users?.map((user: User) => ({
    label: user.name,
    value: user.id
  })) ?? [])

  return options
})

const filteredTasks = computed(() => {
  if (!data.value?.tasks) return []

  if (selectedUserId.value === null) {
    return data.value.tasks
  }

  if (selectedUserId.value === 0) {
    return data.value.tasks.filter(t => !t.assignedTo)
  }

  return data.value.tasks.filter(t => t.assignedTo === selectedUserId.value)
})

const tasksByStatus = computed(() => {
  return {
    todo: filteredTasks.value.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.value.filter(t => t.status === 'in_progress'),
    done: filteredTasks.value.filter(t => t.status === 'done')
  }
})

const handleTaskChange = async () => {
  await refresh()
}

const openCreateTask = () => {
  selectedTaskId.value = null
  isTaskModalOpen.value = true
}

const handleTaskToUpdate = (taskId: number) => {
  selectedTaskId.value = taskId
  isTaskModalOpen.value = true
}

const handleTaskMoved = async (taskId: number, newStatus: string) => {
  try {
    await $fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: { status: newStatus }
    })
    await refresh()
  } catch (error) {
    console.error('Erreur lors du déplacement de la tâche:', error)
  }
}

const taskToEdit = computed(() => {
  if (!selectedTaskId.value) return null
  return data.value?.tasks?.find(t => t.id === selectedTaskId.value) ?? null
})
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold mb-2">
        To Do List globale
      </h1>

      <div class="flex items-center gap-4">
        <USelectMenu
          v-model="selectedUser"
          :items="userOptions"
          placeholder="Filtrer par utilisateur"
          value-attribute="value"
          option-attribute="label"
          class="w-64"
        >
          <template #leading>
            <UIcon name="i-lucide-filter" />
          </template>
        </USelectMenu>

        <UButton
          icon="i-lucide-plus"
          @click="openCreateTask"
        >
          Ajouter une tâche
        </UButton>
      </div>
    </div>

    <TaskModal
      v-model:open="isTaskModalOpen"
      :task-id="selectedTaskId"
      :task="taskToEdit"
      @saved="handleTaskChange"
    />

    <div class="w-full flex gap-8 h-[calc(100vh-12rem)]">
      <KanbanTable
        :key="`todo-${selectedUserId}`"
        status="todo"
        :tasks="tasksByStatus.todo"
        @task-deleted="handleTaskChange"
        @task-to-updated="handleTaskToUpdate"
        @task-moved="handleTaskMoved"
      />
      <KanbanTable
        :key="`in_progress-${selectedUserId}`"
        status="in_progress"
        :tasks="tasksByStatus.in_progress"
        @task-deleted="handleTaskChange"
        @task-to-updated="handleTaskToUpdate"
        @task-moved="handleTaskMoved"
      />
      <KanbanTable
        :key="`done-${selectedUserId}`"
        status="done"
        :tasks="tasksByStatus.done"
        @task-deleted="handleTaskChange"
        @task-to-updated="handleTaskToUpdate"
        @task-moved="handleTaskMoved"
      />
    </div>
  </div>
</template>
