<script setup lang="ts">
import { useDragAndDrop } from '@formkit/drag-and-drop/vue'
import type { Task } from '~/validation'

const props = withDefaults(defineProps<{
  status: 'todo' | 'in_progress' | 'done'
  tasks?: Task[]
}>(), { tasks: () => [] })

const emit = defineEmits<{
  taskDeleted: []
  taskToUpdated: [taskId: number]
  taskMoved: [taskId: number, newStatus: string]
}>()

const statuSettings: Record<'todo' | 'in_progress' | 'done', { label: string, bgClass: string, badgeClass: string }> = {
  todo: { label: 'À faire', bgClass: 'bg-elevated', badgeClass: 'bg-accented' },
  in_progress: { label: 'En cours', bgClass: 'bg-blue-50', badgeClass: 'bg-blue-100' },
  done: { label: 'Terminées', bgClass: 'bg-orange-50', badgeClass: 'bg-orange-100' }
}

const { bgClass, badgeClass, label } = statuSettings[props.status]

const [parent, taskList] = useDragAndDrop(props.tasks, {
  group: 'kanban-tasks',
  onDragend: (data) => {
    const draggedTask = data.draggedNode.data.value as Task
    const targetParent = data.parent.el as HTMLElement
    const targetStatus = targetParent.dataset.status as 'todo' | 'in_progress' | 'done'

    if (draggedTask && targetStatus && draggedTask.status !== targetStatus) {
      emit('taskMoved', draggedTask.id, targetStatus)
    }
  }
})

const onDeleteTask = async (taskId: number) => {
  try {
    await useFetch(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    })
    emit('taskDeleted')
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error)
  }
}
</script>

<template>
  <div :class="['flex-1 p-3 flex flex-col items-start gap-8', bgClass, 'rounded-lg']">
    <div
      :class="['font-medium inline-flex items-center text-base px-2.5 py-1 gap-1.5 rounded-md',
               badgeClass]"
    >
      <span>{{ label }}</span>
    </div>
    <div
      v-if="taskList.length !== 0"
      ref="parent"
      :data-status="props.status"
      class="w-full flex-1 flex flex-col gap-2 overflow-y-auto"
    >
      <TaskCard
        v-for="task in taskList"
        :key="task.id"
        :task="task"
        @delete="onDeleteTask"
        @update="emit('taskToUpdated', $event)"
      />
    </div>
    <div
      v-if="taskList.length === 0"
      class="w-full flex-1 flex flex-col gap-2 overflow-y-auto"
    >
      <div
        class="text-center py-8 text-gray-400"
      >
        Aucune tâche {{ label.toLowerCase() }}
      </div>
    </div>
  </div>
</template>
