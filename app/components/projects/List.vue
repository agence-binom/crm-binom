<script setup lang="ts">
import type { Project } from '~/types'

const props = defineProps<{
  projects: Project[]
  clientId?: number
  showHeader?: boolean
  showCreateButton?: boolean
  showDeleteButton?: boolean
  emptyMessage?: string
}>()

const emit = defineEmits<{
  create: []
  edit: [projectId: number]
  delete: [projectId: number]
  archive: [projectId: number]
  restore: [projectId: number]
}>()

const showArchived = ref(false)
const filteredProjects = computed(() => props.projects.filter(project => Boolean(project.archived) === showArchived.value))

const toggleArchived = () => {
  showArchived.value = !showArchived.value
}
</script>

<template>
  <div class="space-y-6">
    <AppListHeader
      v-if="showHeader"
      title="Projets"
      icon="i-lucide-folder"
      :count="filteredProjects.length"
    >
      <template #actions>
        <UButton
          :icon="showArchived ? 'i-lucide-folder' : 'i-lucide-archive'"
          variant="ghost"
          color="neutral"
          @click="toggleArchived"
        >
          {{ showArchived ? 'Voir les projets actifs' : 'Voir les projets archivés' }}
        </UButton>
        <UButton
          v-if="showCreateButton"
          icon="i-lucide-circle-plus"
          variant="soft"
          color="neutral"
          @click="emit('create')"
        >
          Nouveau projet
        </UButton>
      </template>
    </AppListHeader>

    <TransitionGroup
      v-if="filteredProjects.length > 0"
      name="list"
      tag="ul"
      class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <li
        v-for="project in filteredProjects"
        :key="project.id"
      >
        <NuxtLink
          :to="`/clients/${clientId || project.clientId}/projects/${project.id}`"
          class="group block h-full"
        >
          <ProjectsCard
            :project="project"
            :show-delete-button="showDeleteButton"
            @delete="emit('delete', project.id)"
            @edit="emit('edit', project.id)"
            @archive="emit('archive', project.id)"
            @restore="emit('restore', project.id)"
          />
        </NuxtLink>
      </li>
    </TransitionGroup>

    <AppEmptyState
      v-else
      icon="i-lucide-folder-open"
      :title="showArchived ? 'Aucun projet archivé' : (emptyMessage || 'Aucun projet')"
    >
      <template
        v-if="showCreateButton && !showArchived"
        #actions
      >
        <UButton
          icon="i-lucide-circle-plus"
          variant="soft"
          color="neutral"
          @click="emit('create')"
        >
          Créer le premier projet
        </UButton>
      </template>
    </AppEmptyState>
  </div>
</template>
