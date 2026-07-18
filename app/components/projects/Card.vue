<script setup lang="ts">
import { getProjectDisplayStatus } from '~/lib/projects'
import type { Project } from '~/types'

const props = defineProps<{
  project: Project
  showDeleteButton?: boolean
}>()

const emit = defineEmits<{
  delete: [projectId: number]
  edit: [projectId: number]
  archive: [projectId: number]
  restore: [projectId: number]
}>()

const { getStatusColor, getStatusLabel } = useStatusHelpers()

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return null
  return new Date(date).toLocaleDateString('fr-FR')
}

const badge = computed(() => {
  if (!props.project.status && !props.project.startDate && !props.project.endDate) return undefined
  const status = getProjectDisplayStatus(props.project)
  return {
    label: getStatusLabel(status),
    color: getStatusColor(status) as 'neutral' | 'primary' | 'success' | 'warning' | 'error'
  }
})

const infos = computed(() => [
  props.project.startDate ? { icon: 'i-lucide-calendar-range', label: formatDate(props.project.startDate)! } : null,
  props.project.endDate ? { icon: 'i-lucide-flag', label: formatDate(props.project.endDate)! } : null
].filter(i => i !== null))
</script>

<template>
  <AppCard
    :title="project.name"
    :subtitle="project.description ?? undefined"
    :badge="badge"
    :infos="infos"
    hoverable
  >
    <template #actions>
      <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-pencil"
          aria-label="Modifier le projet"
          @click.prevent.stop="emit('edit', project.id)"
        />
        <UButton
          v-if="!project.archived"
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-archive"
          aria-label="Archiver le projet"
          @click.prevent.stop="emit('archive', project.id)"
        />
        <template v-else>
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-archive-restore"
            aria-label="Restaurer le projet"
            @click.prevent.stop="emit('restore', project.id)"
          />
          <UButton
            size="xs"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            aria-label="Supprimer le projet"
            @click.prevent.stop="emit('delete', project.id)"
          />
        </template>
      </div>
    </template>
  </AppCard>
</template>
