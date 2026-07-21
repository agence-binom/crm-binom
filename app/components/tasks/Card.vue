<script setup lang="ts">
import {
  getTaskPriorityClass,
  getTaskPriorityIcon,
  getTaskPriorityLabel
} from '~/lib/tasks'
import { formatDateOnly } from '~/lib/utils'
import type { Task } from '~/types'

const props = defineProps<{
  task: Task
  userName?: string
  projectName?: string
  clientName?: string | null
  clientId?: number
}>()

const emit = defineEmits<{
  update: [taskId: number]
  delete: [taskId: number]
}>()

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

const projectLink = computed(() => {
  if (!props.task.projectId || !props.clientId) {
    return
  }
  return `clients/${props.clientId}/projects/${props.task.projectId}`
})
</script>

<template>
  <div class="group flex items-start gap-2">
    <UIcon
      name="i-lucide-grip-vertical"
      class="kanban-handle mt-4 shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
    />
    <UCard class="flex-1 rounded-[1.35rem] border-0 bg-white/90 shadow-sm ring-1 ring-gray-200/80 backdrop-blur">
      <div class="space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex justify-between items-center gap-2">
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
              <div class="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
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

        <div class="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs text-slate-600">
          <a
            v-if="projectLabel"
            :href="projectLink"
            class="w-full flex min-w-0 items-center gap-2 border border-neutral-100 hover:bg-neutral-50 rounded-lg px-2 py-1 transition-colors"
          >
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <UIcon name="i-lucide-briefcase-business" />
            </div>
            <div class="space-y-0 min-w-0">
              <p class="truncate font-medium text-slate-700">
                {{ projectName }}
              </p>
              <p class="truncate text-slate-500">
                {{ clientName }}
              </p>
            </div>
          </a>
          <UBadge
            v-if="props.userName"
            variant="soft"
            color="neutral"
            size="md"
            class="rounded-full"
          >
            <UIcon
              name="i-lucide-user-round"
              class="mr-1"
            />
            {{ props.userName }}
          </UBadge>

          <UBadge
            v-if="props.task.dueDate"
            variant="soft"
            color="neutral"
            size="md"
            :class="['rounded-full', isOverdue ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700']"
          >
            <UIcon
              name="i-lucide-calendar-days"
            />
            {{ formatDateOnly(props.task.dueDate) }}
          </UBadge>
        </div>
      </div>
    </UCard>
  </div>
</template>
