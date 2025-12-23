<template>
  <UCard class="hover:shadow-md transition-shadow cursor-pointer">
    <div class="space-y-3">
      <!-- Titre et priorité -->
      <div class="flex items-start justify-between">
        <h4
          class="font-semibold flex-1"
          :class="task.status === 'done' ? 'line-through text-gray-400' : ''"
        >
          {{ task.title }}
        </h4>
        <UBadge
          :color="getPriorityColor(task.priority)"
          size="xs"
        >
          {{ getPriorityLabel(task.priority) }}
        </UBadge>
      </div>

      <!-- Description -->
      <p
        v-if="task.description"
        class="text-sm text-gray-600 dark:text-gray-400"
      >
        {{ task.description }}
      </p>

      <!-- Date limite -->
      <div
        v-if="task.dueDate"
        class="flex items-center gap-1 text-xs"
        :class="getDueDateClass()"
      >
        <UIcon name="i-lucide-calendar" />
        {{ formatDate(task.dueDate) }}
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-2 border-t">
        <div class="flex gap-1">
          <UButton
            v-if="task.status !== 'todo'"
            icon="i-lucide-arrow-left"
            size="xs"
            variant="soft"
            @click="emit('update', task.id, { status: 'todo' })"
          />
          <UButton
            v-if="task.status === 'todo'"
            icon="i-lucide-play"
            size="xs"
            color="primary"
            @click="emit('update', task.id, { status: 'in_progress' })"
          >
            Démarrer
          </UButton>
          <UButton
            v-if="task.status === 'in_progress'"
            icon="i-lucide-check"
            size="xs"
            color="success"
            @click="emit('update', task.id, { status: 'done' })"
          >
            Terminer
          </UButton>
          <UButton
            v-if="task.status === 'done'"
            icon="i-lucide-rotate-ccw"
            size="xs"
            variant="soft"
            @click="emit('update', task.id, { status: 'in_progress' })"
          />
        </div>

        <UButton
          icon="i-lucide-trash-2"
          size="xs"
          color="error"
          variant="ghost"
          @click="emit('delete', task.id)"
        />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Task {
  id: number
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: Date | string | null
  projectId: number | null
  assignedTo?: number | null
  createdAt: Date | string
  updatedAt: Date | string
}

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  update: [taskId: number, updates: Record<string, unknown>]
  delete: [taskId: number]
}>()

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'neutral'
    case 'medium': return 'warning'
    case 'high': return 'error'
    default: return 'neutral'
  }
}

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'low': return 'Basse'
    case 'medium': return 'Moyenne'
    case 'high': return 'Haute'
    default: return priority
  }
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('fr-FR')
}

const getDueDateClass = () => {
  if (!props.task.dueDate) return ''

  const due = new Date(props.task.dueDate)
  const today = new Date()
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'text-red-600'
  if (diffDays === 0) return 'text-orange-600'
  if (diffDays <= 3) return 'text-yellow-600'
  return 'text-gray-600'
}
</script>
