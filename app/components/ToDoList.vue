<script setup lang="ts">
import type { Task } from '~/validation'

const props = withDefaults(defineProps<{
  tasks: Task[]
  title?: string
  projectId?: number
  showUserFilter?: boolean
}>(), {
  title: 'To Do List',
  showUserFilter: false
})

const emit = defineEmits<{
  refresh: []
}>()

const isTaskModalOpen = ref(false)
const selectedTaskId = ref<number | null>(null)

const tasksByStatus = computed(() => {
  return {
    todo: props.tasks.filter(t => t.status === 'todo'),
    in_progress: props.tasks.filter(t => t.status === 'in_progress'),
    done: props.tasks.filter(t => t.status === 'done')
  }
})

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
    emit('refresh')
  } catch (error) {
    console.error('Erreur lors du déplacement de la tâche:', error)
  }
}

const handleTaskChange = () => {
  emit('refresh')
}

const taskToEdit = computed(() => {
  if (!selectedTaskId.value) return null
  return props.tasks.find(t => t.id === selectedTaskId.value) ?? null
})
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <h2 class="text-2xl font-bold">
        {{ title }}
      </h2>

      <div class="flex items-center gap-4">
        <slot name="filters" />

        <UButton
          icon="i-lucide-circle-plus"
          variant="outline"
          color="neutral"
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
      :project-id="projectId"
      @saved="handleTaskChange"
    />

    <div class="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] min-h-150 overflow-hidden">
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
