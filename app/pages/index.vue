<script setup lang="ts">
const { data, refresh } = await useFetch('/api/tasks')

const isTaskModalOpen = ref(false)
const selectedTaskId = ref<number | null>(null)

const tasksByStatus = computed(() => {
  if (!data.value?.tasks) return { todo: [], in_progress: [], done: [] }

  return {
    todo: data.value.tasks.filter(t => t.status === 'todo'),
    in_progress: data.value.tasks.filter(t => t.status === 'in_progress'),
    done: data.value.tasks.filter(t => t.status === 'done')
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

      <UButton
        icon="i-lucide-plus"
        @click="openCreateTask"
      >
        Ajouter une tâche
      </UButton>
    </div>

    <TaskModal
      v-model:open="isTaskModalOpen"
      :task-id="selectedTaskId"
      :task="taskToEdit"
      @saved="handleTaskChange"
    />

    <!-- Liste des tâches par statut
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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

    -->

    <div class="w-full flex gap-8 h-[calc(100vh-12rem)]">
      <KanbanTable
        status="todo"
        :tasks="tasksByStatus.todo"
        @task-deleted="handleTaskChange"
        @task-to-updated="handleTaskToUpdate"
        @task-moved="handleTaskMoved"
      />
      <KanbanTable
        status="in_progress"
        :tasks="tasksByStatus.in_progress"
        @task-deleted="handleTaskChange"
        @task-to-updated="handleTaskToUpdate"
        @task-moved="handleTaskMoved"
      />
      <KanbanTable
        status="done"
        :tasks="tasksByStatus.done"
        @task-deleted="handleTaskChange"
        @task-to-updated="handleTaskToUpdate"
        @task-moved="handleTaskMoved"
      />
    </div>
  </div>
</template>
