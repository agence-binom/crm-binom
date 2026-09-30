<script setup lang="ts">
import { formatDuration, sumDurations } from '~/lib/utils'
import type { ProjectTimeEntry, Task, User } from '~/types'

const props = defineProps<{
  projectId: number
  timeEntries: ProjectTimeEntry[]
  tasks: Pick<Task, 'id' | 'title'>[]
  users: User[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

const isHistoryModalOpen = ref(false)
const isCreateModalOpen = ref(false)

const totalDuration = computed(() => sumDurations(props.timeEntries))
const hasTimeEntries = computed(() => props.timeEntries.length > 0)

// Sans aucune saisie, l'historique serait vide : le total ouvre directement l'ajout.
const onTotalClick = () => {
  if (hasTimeEntries.value) isHistoryModalOpen.value = true
  else isCreateModalOpen.value = true
}
</script>

<template>
  <div class="group flex items-center gap-1">
    <UTooltip text="Ajouter du temps sur le projet">
      <!-- Visible au survol uniquement quand il y a déjà du temps ; toujours visible sur écran tactile
           (pas de survol possible) ou quand le projet est vide, pour rester découvrable. -->
      <UButton
        size="sm"
        variant="ghost"
        color="neutral"
        icon="i-lucide-plus"
        aria-label="Ajouter du temps sur le projet"
        :class="[
          'transition-opacity duration-150',
          hasTimeEntries && 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
        ]"
        @click="isCreateModalOpen = true"
      />
    </UTooltip>
    <UTooltip :text="hasTimeEntries ? 'Voir l\'historique du temps passé' : 'Aucun temps loggé : ajouter du temps'">
      <UButton
        size="sm"
        variant="soft"
        color="neutral"
        icon="i-lucide-timer"
        class="tabular-nums"
        :aria-label="`Temps passé sur le projet : ${formatDuration(totalDuration)}`"
        @click="onTotalClick"
      >
        {{ formatDuration(totalDuration) }}
      </UButton>
    </UTooltip>
  </div>

  <TimeEntriesModal
    v-model:open="isCreateModalOpen"
    :project-id="projectId"
    :tasks="tasks"
    :assignees="users"
    @saved="emit('refresh')"
  />

  <TimeEntriesHistoryModal
    v-model:open="isHistoryModalOpen"
    :project-id="projectId"
    :time-entries="timeEntries"
    :tasks="tasks"
    :assignees="users"
    @refresh="emit('refresh')"
    @add="isCreateModalOpen = true"
  />
</template>
