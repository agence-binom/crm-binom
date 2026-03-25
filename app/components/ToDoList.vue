<script setup lang="ts">
import type { TaskStatus, TaskWorkflowTag } from '~/constants/tasks'
import {
  getDefaultTaskWorkflowTag,
  isTaskWorkflowTagRequired,
  normalizeTaskWorkflowTag,
  sortTasksByDueDate
} from '~/lib/tasks'
import type { Task, User } from '~/types'

type ToDoListProjectOption = {
  id: number
  name: string
  clientName?: string | null
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
const activeTaskStatuses: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'validation']
const completedTaskStatus: TaskStatus = 'done'

const isTaskModalOpen = ref(false)
const selectedTaskId = ref<number | null>(null)
const deletedTaskIds = ref(new Set<number>())
const showCompletedTasks = ref(false)
const taskWorkflowOverrides = ref(new Map<number, {
  status: Task['status']
  workflowTag: TaskWorkflowTag | null
}>())

const visibleTasks = computed(() => {
  const tasks = props.tasks
    .filter(task => !deletedTaskIds.value.has(task.id))
    .map((task) => {
      const workflowOverride = taskWorkflowOverrides.value.get(task.id)

      if (!workflowOverride) {
        return task
      }

      return {
        ...task,
        status: workflowOverride.status,
        workflowTag: workflowOverride.workflowTag
      }
    })

  return sortTasksByDueDate(tasks)
})

const tasksByStatus = computed(() => {
  return {
    todo: visibleTasks.value.filter(t => t.status === 'todo'),
    in_progress: visibleTasks.value.filter(t => t.status === 'in_progress'),
    waiting: visibleTasks.value.filter(t => t.status === 'waiting'),
    validation: visibleTasks.value.filter(t => t.status === 'validation'),
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
  const previousWorkflow = task
    ? {
        status: task.status,
        workflowTag: task.workflowTag
      }
    : null
  const nextWorkflowTag = isTaskWorkflowTagRequired(newStatus)
    ? (
        normalizeTaskWorkflowTag(newStatus, task?.workflowTag)
        ?? getDefaultTaskWorkflowTag(newStatus)
      )
    : null

  taskWorkflowOverrides.value = new Map(taskWorkflowOverrides.value).set(taskId, {
    status: newStatus,
    workflowTag: nextWorkflowTag
  })

  try {
    await $fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: { status: newStatus, workflowTag: nextWorkflowTag ?? undefined }
    })
  } catch (error) {
    const nextOverrides = new Map(taskWorkflowOverrides.value)

    if (previousWorkflow) {
      nextOverrides.set(taskId, previousWorkflow)
    } else {
      nextOverrides.delete(taskId)
    }

    taskWorkflowOverrides.value = nextOverrides
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

    <TaskModal
      v-model:open="isTaskModalOpen"
      :task-id="selectedTaskId"
      :task="taskToEdit"
      :project-id="projectId"
      :projects="availableProjects"
      :users="availableUsers"
      @saved="handleTaskChange"
    />

    <div class="overflow-x-auto p-1 pb-3 scrollbar-custom">
      <div class="flex min-w-max gap-6 h-[calc(100vh-10rem)] min-h-150">
        <KanbanTable
          v-for="status in displayedStatuses"
          :key="status"
          :status="status"
          :tasks="tasksByStatus[status]"
          :users="availableUsers"
          :projects="availableProjects"
          @task-deleted="handleTaskDeleted"
          @task-to-updated="handleTaskToUpdate"
          @task-moved="handleTaskMoved"
        />
      </div>
    </div>
  </div>
</template>
