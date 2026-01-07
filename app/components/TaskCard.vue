<script setup lang="ts">
import type { Task } from '~/validation/tasks'

const props = defineProps<{
  task: Task
  userName?: string
}>()

const emit = defineEmits<{
  update: [taskId: number]
  delete: [taskId: number]
}>()

// const getPriorityColor = (priority: string) => {
//   switch (priority) {
//     case 'low': return 'neutral'
//     case 'medium': return 'warning'
//     case 'high': return 'error'
//     default: return 'neutral'
//   }
// }

// const getPriorityLabel = (priority: string) => {
//   switch (priority) {
//     case 'low': return 'Basse'
//     case 'medium': return 'Moyenne'
//     case 'high': return 'Haute'
//     default: return priority
//   }
// }

// const formatDate = (date: Date | string) => {
//   return new Date(date).toLocaleDateString('fr-FR')
// }

// const getDueDateClass = () => {
//   if (!props.task.dueDate) return ''

//   const due = new Date(props.task.dueDate)
//   const today = new Date()
//   const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

//   if (diffDays < 0) return 'text-red-600'
//   if (diffDays === 0) return 'text-orange-600'
//   if (diffDays <= 3) return 'text-yellow-600'
//   return 'text-gray-600'
// }
</script>

<template>
  <div class="flex items-center gap-2 ">
    <UIcon
      name="i-lucide-grip-vertical"
      class="kanban-handle text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing shrink-0 mt-0.5"
    />
    <UCard class="shrink-0 flex-1 hover:shadow-md transition-shadow">
      <template #header>
        <div class="flex items-start gap-2">
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-sm ui-text-highlighted">
              {{ props.task.title }}
            </h4>
            <p
              v-if="props.task.notes"
              class="text-xs ui-text-muted mt-1"
            >
              {{ props.task.notes }}
            </p>
            <div
              v-if="props.userName"
              class="text-xs text-gray-500 mt-1 flex items-center gap-1"
            >
              <UIcon name="i-lucide-user" />
              <span>{{ props.userName }}</span>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            icon="i-lucide-edit"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="emit('update', props.task.id)"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            color="error"
            variant="ghost"
            @click="emit('delete', props.task.id)"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
