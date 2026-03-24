<script setup lang="ts">
import type { Task, User } from '~/validation'

type ToDoListProjectOption = {
  id: number
  name: string
}

const props = withDefaults(defineProps<{
  tasks: Task[]
  title?: string
  projectId?: number
  showUserFilter?: boolean
  availableProjects?: ToDoListProjectOption[]
  availableUsers?: User[]
}>(), {
  title: 'To Do List',
  showUserFilter: false
})

const emit = defineEmits<{
  refresh: []
}>()
const { showError } = useFeedbackToast()

const isTaskModalOpen = ref(false)
const selectedTaskId = ref<number | null>(null)
const deletedTaskIds = ref(new Set<number>())
const taskStatusOverrides = ref(new Map<number, Task['status']>())

const visibleTasks = computed(() => {
  return props.tasks
    .filter(task => !deletedTaskIds.value.has(task.id))
    .map((task) => {
      const statusOverride = taskStatusOverrides.value.get(task.id)

      if (!statusOverride) {
        return task
      }

      return {
        ...task,
        status: statusOverride
      }
    })
})

const tasksByStatus = computed(() => {
  return {
    todo: visibleTasks.value.filter(t => t.status === 'todo'),
    in_progress: visibleTasks.value.filter(t => t.status === 'in_progress'),
    done: visibleTasks.value.filter(t => t.status === 'done')
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
  const task = visibleTasks.value.find(currentTask => currentTask.id === taskId)
  const previousStatus = task?.status

  taskStatusOverrides.value = new Map(taskStatusOverrides.value).set(taskId, newStatus as Task['status'])

  try {
    await $fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: { status: newStatus }
    })
  } catch (error) {
    const nextOverrides = new Map(taskStatusOverrides.value)

    if (previousStatus) {
      nextOverrides.set(taskId, previousStatus)
    } else {
      nextOverrides.delete(taskId)
    }

    taskStatusOverrides.value = nextOverrides
    console.error('Erreur lors du déplacement de la tâche:', error)
    showError('Déplacement impossible', error, 'Impossible de déplacer la tâche.')
  }
}

const handleTaskChange = () => {
  emit('refresh')
}

const handleTaskDeleted = (taskId: number) => {
  deletedTaskIds.value = new Set([
    ...deletedTaskIds.value,
    taskId
  ])
}

const taskToEdit = computed(() => {
  if (!selectedTaskId.value) return null
  return visibleTasks.value.find(t => t.id === selectedTaskId.value) ?? null
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
      :projects="availableProjects"
      :users="availableUsers"
      @saved="handleTaskChange"
    />

    <div class="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] min-h-150 overflow-hidden">
      <KanbanTable
        status="todo"
        :tasks="tasksByStatus.todo"
        @task-deleted="handleTaskDeleted"
        @task-to-updated="handleTaskToUpdate"
        @task-moved="handleTaskMoved"
      />
      <KanbanTable
        status="in_progress"
        :tasks="tasksByStatus.in_progress"
        @task-deleted="handleTaskDeleted"
        @task-to-updated="handleTaskToUpdate"
        @task-moved="handleTaskMoved"
      />
      <KanbanTable
        status="done"
        :tasks="tasksByStatus.done"
        @task-deleted="handleTaskDeleted"
        @task-to-updated="handleTaskToUpdate"
        @task-moved="handleTaskMoved"
      />
    </div>
  </div>
</template>
