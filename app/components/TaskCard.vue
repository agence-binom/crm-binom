<script setup lang="ts">
import {
  getTaskPriorityClass,
  getTaskPriorityIcon,
  getTaskPriorityLabel,
  getTaskWorkflowTagLabel
} from '~/lib/tasks'
import { formatDateOnly } from '~/lib/utils'
import type { Task } from '~/types'

const props = defineProps<{
  task: Task
  userName?: string
  projectName?: string
  clientName?: string | null
}>()

const emit = defineEmits<{
  update: [taskId: number]
  delete: [taskId: number]
}>()

const getWorkflowTagClass = (tag: Task['workflowTag']) => {
  switch (tag) {
    case 'budget':
      return 'bg-amber-100 text-amber-700 ring-amber-200'
    case 'dependency':
      return 'bg-rose-100 text-rose-700 ring-rose-200'
    case 'binom':
      return 'bg-violet-100 text-violet-700 ring-violet-200'
    case 'client':
      return 'bg-sky-100 text-sky-700 ring-sky-200'
    default:
      return 'bg-orange-100 text-orange-700 ring-orange-200'
  }
}

const isOverdue = computed(() => {
  if (!props.task.dueDate || props.task.status === 'done') {
    return false
  }

  return new Date(props.task.dueDate).getTime() < Date.now()
})

const projectLabel = computed(() => {
  if (!props.projectName) {
    return undefined
  }

  if (!props.clientName) {
    return props.projectName
  }

  return `${props.projectName} · ${props.clientName}`
})
</script>

<template>
  <div class="group flex items-start gap-2">
    <UIcon
      name="i-lucide-grip-vertical"
      class="kanban-handle mt-4 shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
    />
    <UCard class="flex-1 rounded-[1.35rem] border-0 bg-white/90 shadow-sm ring-1 ring-gray-200/80 backdrop-blur">
      <div class="flex items-center gap-1 opacity-0 absolute top-2 right-2 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <UButton
          icon="i-lucide-edit"
          size="xs"
          color="neutral"
          variant="ghost"
          class="rounded-full"
          aria-label="Modifier la tâche"
          @click="emit('update', props.task.id)"
        />
        <UButton
          icon="i-lucide-trash-2"
          size="xs"
          color="error"
          variant="ghost"
          class="rounded-full"
          aria-label="Supprimer la tâche"
          @click="emit('delete', props.task.id)"
        />
      </div>
      <div class="space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                variant="soft"
                color="neutral"
                size="sm"
                :class="['rounded-full ring-1 ring-inset', getTaskPriorityClass(props.task.priority)]"
              >
                <UIcon
                  :name="getTaskPriorityIcon(props.task.priority)"
                  class="mr-1"
                />
                {{ getTaskPriorityLabel(props.task.priority) }}
              </UBadge>
              <UBadge
                variant="soft"
                color="neutral"
                size="sm"
                class="rounded-full bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200"
              >
                <UIcon
                  name="i-lucide-user-round"
                  class="mr-1"
                />
                {{ props.userName || 'Non assigné' }}
              </UBadge>
              <UBadge
                v-if="props.task.workflowTag"
                variant="soft"
                color="neutral"
                size="sm"
                :class="['rounded-full ring-1 ring-inset', getWorkflowTagClass(props.task.workflowTag)]"
              >
                {{ getTaskWorkflowTagLabel(props.task.workflowTag) }}
              </UBadge>
            </div>

            <h4 class="mt-3 truncate text-base font-semibold text-slate-900">
              {{ props.task.title }}
            </h4>
            <p
              v-if="props.task.notes"
              class="mt-2 line-clamp-3 text-sm leading-6 text-gray-600"
            >
              {{ props.task.notes }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-sm text-slate-600">
          <div
            v-if="projectLabel"
            class="flex min-w-0 items-center gap-2"
          >
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <UIcon name="i-lucide-briefcase-business" />
            </div>
            <p class=" font-medium text-slate-700">
              {{ projectLabel }}
            </p>
          </div>

          <div
            v-if="props.task.dueDate"
            :class="[
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs',
              isOverdue ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'
            ]"
          >
            <UIcon
              name="i-lucide-calendar-days"
            />
            <span class="font-medium">
              {{ formatDateOnly(props.task.dueDate) }}
            </span>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
