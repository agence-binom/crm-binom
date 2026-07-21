<script setup lang="ts">
import { useDragAndDrop } from '@formkit/drag-and-drop/vue'
import type { TaskStatus } from '~/constants/tasks'
import type { Task, User } from '~/types'

type KanbanProjectOption = {
  id: number
  name: string
  clientName?: string | null
  clientId?: number
}

const props = withDefaults(defineProps<{
  status: TaskStatus
  tasks?: Task[]
  users?: User[]
  projects?: KanbanProjectOption[]
}>(), {
  tasks: () => [],
  users: () => [],
  projects: () => []
})

const usersMap = computed(() => {
  return new Map(props.users.map(user => [user.id, user.name]))
})

const projectsMap = computed(() => {
  return new Map(props.projects.map(project => [project.id, project]))
})

const emit = defineEmits<{
  taskDeleted: [taskId: number]
  taskToUpdated: [taskId: number]
  taskMoved: [taskId: number, newStatus: TaskStatus]
}>()
const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()

const statuSettings: Record<TaskStatus, {
  label: string
  bgClass: string
  badgeColor: 'neutral' | 'primary' | 'warning' | 'success'
  badgeIcon: string
  badgeClass: string
  emptyIconClass: string
}> = {
  todo: {
    label: 'À faire',
    bgClass: 'bg-slate-50/90 ring-1 ring-slate-200/80',
    badgeColor: 'neutral',
    badgeIcon: 'i-lucide-list-todo',
    badgeClass: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200',
    emptyIconClass: 'text-slate-300'
  },
  in_progress: {
    label: 'En cours',
    bgClass: 'bg-blue-50/90 ring-1 ring-blue-200/80',
    badgeColor: 'primary',
    badgeIcon: 'i-lucide-loader-circle',
    badgeClass: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200',
    emptyIconClass: 'text-blue-300'
  },
  waiting: {
    label: 'En attente',
    bgClass: 'bg-orange-50/90 ring-1 ring-orange-200/80',
    badgeColor: 'warning',
    badgeIcon: 'i-lucide-hourglass',
    badgeClass: 'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200',
    emptyIconClass: 'text-orange-300'
  },
  validationBinom: {
    label: 'À valider par binōm',
    bgClass: 'bg-violet-50/90 ring-1 ring-violet-200/80',
    badgeColor: 'primary',
    badgeIcon: 'i-lucide-badge-check',
    badgeClass: 'bg-violet-100 text-violet-700 ring-1 ring-inset ring-violet-200',
    emptyIconClass: 'text-violet-300'
  },
  validationClient: {
    label: 'À valider par le client',
    bgClass: 'bg-cyan-50/90 ring-1 ring-cyan-200/80',
    badgeColor: 'primary',
    badgeIcon: 'i-lucide-badge-check',
    badgeClass: 'bg-cyan-100 text-cyan-700 ring-1 ring-inset ring-cyan-200',
    emptyIconClass: 'text-cyan-300'
  },
  done: {
    label: 'Terminées',
    bgClass: 'bg-emerald-50/90 ring-1 ring-emerald-200/80',
    badgeColor: 'success',
    badgeIcon: 'i-lucide-check-check',
    badgeClass: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    emptyIconClass: 'text-emerald-300'
  }
}

const { bgClass, badgeColor, badgeIcon, badgeClass, emptyIconClass, label } = statuSettings[props.status]

const [parent, taskList] = useDragAndDrop<Task>(props.tasks, {
  group: 'kanban-tasks',
  dragHandle: '.kanban-handle',
  draggable: (el) => {
    return !el.hasAttribute('data-no-drag')
  },
  onDragstart: (_data) => {
    // Ajouter classe sur toutes les zones de drop
    document.querySelectorAll('[data-status]').forEach((zone) => {
      zone.setAttribute('data-drop-zone-active', 'true')
    })
  },
  onDragend: (data) => {
    // Retirer classe des zones de drop
    document.querySelectorAll('[data-status]').forEach((zone) => {
      zone.removeAttribute('data-drop-zone-active')
    })

    const draggedTask = data.draggedNode.data.value as Task
    const targetParent = data.parent.el as HTMLElement
    const targetStatus = targetParent.dataset.status as TaskStatus

    if (draggedTask && targetStatus && draggedTask.status !== targetStatus) {
      emit('taskMoved', draggedTask.id, targetStatus)
    }
  }
})

watch(() => props.tasks, (newTasks) => {
  taskList.value = [...newTasks]
}, { deep: true })

const onDeleteTask = async (taskId: number) => {
  try {
    await deleteResource('tâche', taskId, '/api/tasks', async () => {
      taskList.value = taskList.value.filter(task => task.id !== taskId)
      emit('taskDeleted', taskId)
    })
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error)
  }
}
</script>

<template>
  <div :class="['h-full min-w-88 w-88 flex flex-col gap-4 rounded-[1.5rem] p-4 overflow-hidden shadow-sm backdrop-blur-sm', bgClass]">
    <div class="w-full flex justify-between items-center shrink-0">
      <UBadge
        variant="soft"
        :color="badgeColor"
        :icon="badgeIcon"
        size="md"
        :class="['rounded-full px-3.5 py-1.5 font-semibold', badgeClass]"
      >
        {{ label }}
      </UBadge>

      <span class="text-sm text-gray-500 font-medium tracking-tight">
        {{ taskList.length }} tâche{{ taskList.length > 1 ? 's' : '' }}
      </span>
    </div>

    <div
      ref="parent"
      :data-status="props.status"
      class="w-full flex-1 flex flex-col items-stretch gap-4 overflow-y-auto pr-1 scrollbar-custom pt-1 rounded-2xl transition-all duration-300 min-h-0"
    >
      <template v-if="taskList.length > 0">
        <TasksCard
          v-for="task in taskList"
          :key="task.id"
          :task="task"
          :user-name="task.assignedTo ? usersMap.get(task.assignedTo) : 'Non assigné'"
          :project-name="task.projectId ? projectsMap.get(task.projectId)?.name : undefined"
          :client-name="task.projectId ? projectsMap.get(task.projectId)?.clientName : undefined"
          :client-id="task.projectId ? projectsMap.get(task.projectId)?.clientId : undefined"
          @delete="onDeleteTask"
          @update="emit('taskToUpdated', $event)"
        />
      </template>
      <div
        v-else
        class="flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/70 bg-white/50 px-6 text-center"
      >
        <UIcon
          :name="badgeIcon"
          :class="['mb-3 text-3xl', emptyIconClass]"
        />
        <p class="text-sm font-medium text-gray-500">
          Aucune tâche {{ label.toLowerCase() }}
        </p>
        <p class="mt-1 text-xs text-gray-400">
          Déplace une tâche ici ou crée-en une nouvelle.
        </p>
      </div>
    </div>
  </div>

  <ConfirmModal
    :open="confirmModalOpen"
    title="Confirmer la suppression"
    :message="confirmModalMessage"
    @confirm="onConfirm"
    @cancel="onCancel"
  />
</template>
