<script setup lang="ts">
import { formatDateOnly } from '~/lib/utils'
import type { Task } from '~/validation/tasks'

const props = defineProps<{
  task: Task
  userName?: string
}>()

const emit = defineEmits<{
  update: [taskId: number]
  delete: [taskId: number]
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <UIcon
      name="i-lucide-grip-vertical"
      class="kanban-handle text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing shrink-0 mt-0.5"
    />
    <UCard class="shrink-0 flex-1">
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
            <div
              v-if="props.task.dueDate"
              class="text-xs text-gray-500 mt-1 flex items-center gap-1"
            >
              <UIcon name="i-lucide-calendar-days" />
              <span>Échéance {{ formatDateOnly(props.task.dueDate) }}</span>
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
            aria-label="Modifier la tâche"
            @click="emit('update', props.task.id)"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            color="error"
            variant="ghost"
            aria-label="Supprimer la tâche"
            @click="emit('delete', props.task.id)"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
