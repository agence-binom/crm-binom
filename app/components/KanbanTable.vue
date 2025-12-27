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

const tasksByUser = computed(() => {
  if (!props.tasks) return []

  const grouped = props.tasks.reduce((acc, task) => {
    const userId = task.assignedTo || 0
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        userName: userId === 0 ? 'Non assigné' : usersMap.value.get(userId) || 'Utilisateur inconnu',
        tasks: []
      }
    }
    acc[userId].tasks.push(task)
    return acc
  }, {} as Record<number, { userId: number, userName: string, tasks: Task[] }>)

  return Object.values(grouped).sort((a, b) => {
    if (a.userId === 0) return 1
    if (b.userId === 0) return -1
    return a.userId - b.userId
  })
})

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
  dragHandle: '.kanban-handle',
  draggable: (el) => {
    return !el.hasAttribute('data-no-drag')
  },
  onDragend: (data) => {
    console.log('Drag ended', data)
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
    <div class="w-full flex justify-between items-center mb-4">
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
      class="w-full h-full flex flex-col items-stretch gap-4 overflow-y-auto pr-1 scrollbar-custom"
    >
      <template v-if="tasksByUser.length > 0">
        <template
          v-for="userGroup in tasksByUser"
          :key="userGroup.userId"
        >
          <div
            class="text-xs font-semibold text-gray-600 px-2 py-1 bg-gray-100 rounded"
            data-no-drag
          >
            {{ userGroup.userName }}
          </div>
          <TaskCard
            v-for="task in userGroup.tasks"
            :key="task.id"
            :task="task"
            @delete="onDeleteTask"
            @update="emit('taskToUpdated', $event)"
          />
        </template>
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
