<script setup lang="ts">
import type { TaskStatus } from '~/constants/tasks'
import { sortTasksByDueDate } from '~/lib/tasks'
import type { Task, User } from '~/types'

type ToDoListProjectOption = {
  id: number
  name: string
  clientName?: string | null
}

const props = withDefaults(defineProps<{
  tasks: Task[]
  title?: string
  titleHeading?: 'h1' | 'h2' | 'h3'
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
const activeTaskStatuses: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'validationBinom', 'validationClient']
const completedTaskStatus: TaskStatus = 'done'

const isTaskModalOpen = ref(false)
const selectedTaskId = ref<number | null>(null)
const deletedTaskIds = ref(new Set<number>())
const showCompletedTasks = ref(false)
const taskStatusOverrides = ref(new Map<number, Task['status']>())

const visibleTasks = computed(() => {
  const tasks = props.tasks
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

  return sortTasksByDueDate(tasks)
})

const tasksByStatus = computed(() => {
  return {
    todo: visibleTasks.value.filter(t => t.status === 'todo'),
    in_progress: visibleTasks.value.filter(t => t.status === 'in_progress'),
    waiting: visibleTasks.value.filter(t => t.status === 'waiting'),
    validationBinom: visibleTasks.value.filter(t => t.status === 'validationBinom'),
    validationClient: visibleTasks.value.filter(t => t.status === 'validationClient'),
    done: visibleTasks.value.filter(t => t.status === 'done')
  }
})

const displayedStatuses = computed(() => {
  return showCompletedTasks.value
    ? [
        ...activeTaskStatuses,
        completedTaskStatus
      ]
    : activeTaskStatuses
})

const openCreateTask = () => {
  selectedTaskId.value = null
  isTaskModalOpen.value = true
}

const handleTaskToUpdate = (taskId: number) => {
  selectedTaskId.value = taskId
  isTaskModalOpen.value = true
}

const handleTaskMoved = async (taskId: number, newStatus: TaskStatus) => {
  const task = visibleTasks.value.find(currentTask => currentTask.id === taskId)
  const previousStatus = task?.status

  taskStatusOverrides.value = new Map(taskStatusOverrides.value).set(taskId, newStatus)

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
  if (selectedTaskId.value != null) {
    const nextOverrides = new Map(taskStatusOverrides.value)
    nextOverrides.delete(selectedTaskId.value)
    taskStatusOverrides.value = nextOverrides
  }

  emit('refresh')
}

const handleTaskDeleted = (taskId: number) => {
  deletedTaskIds.value = new Set([
    ...deletedTaskIds.value,
    taskId
  ])

  const nextOverrides = new Map(taskStatusOverrides.value)
  nextOverrides.delete(taskId)
  taskStatusOverrides.value = nextOverrides

  if (selectedTaskId.value === taskId) {
    selectedTaskId.value = null
  }

  emit('refresh')
}

const taskToEdit = computed(() => {
  if (!selectedTaskId.value) return null
  return visibleTasks.value.find(t => t.id === selectedTaskId.value) ?? null
})

const showProjectBadge = computed(() => !props.projectId)

const headingClass = computed(() => {
  switch (props.titleHeading) {
    case 'h1':
      return 'text-2xl font-bold'
    case 'h2':
      return 'text-xl font-semibold'
    case 'h3':
      return 'text-lg font-medium'
    default:
      return 'text-2xl font-bold'
  }
})
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <component
        :is="titleHeading || 'h2'"
        :class="headingClass"
      >
        {{ title }}
      </component>

      <div class="flex flex-wrap items-center gap-3">
        <slot name="filters" />

        <UButton
          :icon="showCompletedTasks ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          variant="outline"
          color="neutral"
          @click="showCompletedTasks = !showCompletedTasks"
        >
          {{ showCompletedTasks ? 'Masquer terminées' : 'Afficher terminées' }}
        </UButton>

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

    <TasksModal
      v-model:open="isTaskModalOpen"
      :task-id="selectedTaskId"
      :task="taskToEdit"
      :project-id="projectId"
      :projects="availableProjects"
      :users="availableUsers"
      @saved="handleTaskChange"
      @deleted="handleTaskDeleted"
    />

    <div class="overflow-x-auto p-1 pb-3 scrollbar-custom">
      <div class="flex min-w-max gap-6 h-[calc(100vh-10rem)] min-h-150">
        <TasksKanban
          v-for="status in displayedStatuses"
          :key="status"
          :status="status"
          :tasks="tasksByStatus[status]"
          :users="availableUsers"
          :projects="availableProjects"
          :show-project-badge="showProjectBadge"
          @task-deleted="handleTaskDeleted"
          @task-to-updated="handleTaskToUpdate"
          @task-moved="handleTaskMoved"
        />
      </div>
    </div>
  </div>
</template>
