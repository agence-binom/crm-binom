<script setup lang="ts">
import type { Project } from '~/types'

const _props = defineProps<{
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
}>()
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="showHeader"
      class="flex items-center justify-between gap-4 border-b border-slate-100 pb-4"
    >
      <h2 class="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900">
        <UIcon name="i-lucide-folder" />
        Projets
        <UBadge
          color="neutral"
          variant="soft"
          class="rounded-full"
        >
          {{ projects.length }}
        </UBadge>
      </h2>
      <UButton
        v-if="showCreateButton"
        icon="i-lucide-circle-plus"
        variant="soft"
        color="neutral"
        @click="emit('create')"
      >
        Nouveau projet
      </UButton>
    </div>

    <TransitionGroup
      v-if="projects.length > 0"
      name="list"
      tag="ul"
      class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <li
        v-for="project in projects"
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
          />
        </NuxtLink>
      </li>
    </TransitionGroup>

    <div
      v-else
      class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 px-6 py-10 text-center"
    >
      <UIcon
        name="i-lucide-folder-open"
        class="mb-3 text-4xl text-slate-300"
      />
      <p class="mb-4 text-slate-600">
        {{ emptyMessage || 'Aucun projet' }}
      </p>
      <UButton
        v-if="showCreateButton"
        icon="i-lucide-circle-plus"
        variant="soft"
        @click="emit('create')"
      >
        Créer le premier projet
      </UButton>
    </div>
  </div>
</template>
