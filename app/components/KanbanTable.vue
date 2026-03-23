<script setup lang="ts">
import { useDragAndDrop } from '@formkit/drag-and-drop/vue'
import type { Task } from '~/validation'

const props = withDefaults(defineProps<{
  status: 'todo' | 'in_progress' | 'done'
  tasks?: Task[]
}>(), { tasks: () => [] })

const { data: usersData } = await useFetch('/api/users')
const usersMap = computed(() => {
  if (!usersData.value?.users) return new Map()
  return new Map(usersData.value.users.map(user => [user.id, user.name]))
})

const emit = defineEmits<{
  taskDeleted: []
  taskToUpdated: [taskId: number]
  taskMoved: [taskId: number, newStatus: string]
}>()
const { showError } = useFeedbackToast()

const statuSettings: Record<'todo' | 'in_progress' | 'done', { label: string, bgClass: string, badgeClass: string }> = {
  todo: { label: 'À faire', bgClass: 'bg-elevated', badgeClass: 'bg-accented' },
  in_progress: { label: 'En cours', bgClass: 'bg-blue-50', badgeClass: 'bg-blue-100' },
  done: { label: 'Terminées', bgClass: 'bg-orange-50', badgeClass: 'bg-orange-100' }
}

const { bgClass, badgeClass, label } = statuSettings[props.status]

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
    const targetStatus = targetParent.dataset.status as 'todo' | 'in_progress' | 'done'

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
    await $fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    })
    emit('taskDeleted')
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error)
    showError('Suppression impossible', error, 'Impossible de supprimer la tâche.')
  }
}
</script>

<template>
  <div :class="['h-full flex flex-col gap-4', bgClass, 'rounded-lg p-3 overflow-hidden']">
    <div class="w-full flex justify-between items-center shrink-0">
      <div
        :class="['font-medium inline-flex items-center text-base px-2.5 py-1 gap-1.5 rounded-md',
                 badgeClass]"
      >
        <span>{{ label }}</span>
      </div>

      <span class="text-sm text-gray-500 font-medium">
        {{ taskList.length }} tâche{{ taskList.length > 1 ? 's' : '' }}
      </span>
    </div>

    <div
      ref="parent"
      :data-status="props.status"
      class="w-full flex-1 flex flex-col items-stretch gap-4 overflow-y-auto pr-1 scrollbar-custom pt-1 rounded-lg transition-all duration-300 min-h-0"
    >
      <template v-if="taskList.length > 0">
        <TaskCard
          v-for="task in taskList"
          :key="task.id"
          :task="task"
          :user-name="task.assignedTo ? usersMap.get(task.assignedTo) : 'Non assigné'"
          @delete="onDeleteTask"
          @update="emit('taskToUpdated', $event)"
        />
      </template>
      <div
        v-else
        class="text-center py-8 text-gray-400"
      >
        Aucune tâche {{ label.toLowerCase() }}
      </div>
    </div>
  </div>
</template>
