<script setup lang="ts">
import {
  getTaskPriorityClass,
  getTaskPriorityIcon,
  getTaskPriorityLabel,
  isTaskOverdue
} from '~/lib/tasks'
import { formatDateOnly, formatDuration } from '~/lib/utils'
import type { Task } from '~/types'

const props = withDefaults(defineProps<{
  task: Task
  userNames?: string[]
  projectName?: string
  clientName?: string | null
  clientId?: number
  showProjectBadge?: boolean
}>(), {
  userNames: () => []
})

const emit = defineEmits<{
  update: [taskId: number]
  delete: [taskId: number]
}>()

const isOverdue = computed(() => isTaskOverdue(props.task))

const projectLabel = computed(() => {
  if (!props.showProjectBadge || !props.projectName) {
    return undefined
  }

  if (!props.clientName) {
    return props.projectName
  }

  return `${props.projectName} · ${props.clientName}`
})

const projectLink = computed(() => {
  return `/clients/${props.clientId}/projects/${props.task.projectId}`
})
</script>

<template>
  <div class="group flex items-start gap-2">
    <UIcon
      name="i-lucide-grip-vertical"
      class="kanban-handle mt-4 shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
    />
    <AppCard
      class="flex-1"
      :title="props.task.title"
      clickable
      @click="emit('update', props.task.id)"
    >
      <template #badge>
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
      </template>

      <template #actions>
        <div class="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            color="error"
            variant="ghost"
            aria-label="Supprimer la tâche"
            @click.stop="emit('delete', props.task.id)"
          />
        </div>
      </template>

      <div class="space-y-4">
        <p
          v-if="props.task.notes"
          class="line-clamp-3 text-sm leading-5 text-gray-600"
        >
          {{ props.task.notes }}
        </p>

        <div class="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs text-slate-600">
          <AppLink
            v-if="projectLabel"
            :to="projectLink"
            class="w-full"
            @click.stop
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
          </AppLink>
          <UBadge
            v-for="userName in (props.userNames.length ? props.userNames : ['Non assigné'])"
            :key="userName"
            variant="soft"
            color="neutral"
            size="md"
            class="rounded-full"
          >
            <UIcon
              name="i-lucide-user-round"
              class="mr-1"
            />
            {{ userName }}
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

          <UTooltip
            v-if="props.task.timeSpent"
            text="Temps passé"
          >
            <UBadge
              variant="soft"
              color="neutral"
              size="md"
              class="rounded-full tabular-nums"
              :aria-label="`Temps passé : ${formatDuration(props.task.timeSpent)}`"
            >
              <UIcon name="i-lucide-timer" />
              {{ formatDuration(props.task.timeSpent) }}
            </UBadge>
          </UTooltip>
        </div>
      </div>
    </AppCard>
  </div>
</template>
