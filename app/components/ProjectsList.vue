<script setup lang="ts">
import { getProjectDisplayStatus } from '~/lib/projects'
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
  delete: [projectId: number]
}>()

const { getStatusColor, getStatusLabel } = useStatusHelpers()
</script>

<template>
  <div>
    <div
      v-if="showHeader"
      class="flex justify-between items-center mb-6"
    >
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <UIcon name="i-lucide-folder" />
        Projets
        <UBadge
          color="neutral"
          variant="soft"
        >
          {{ projects.length }}
        </UBadge>
      </h2>
      <UButton
        v-if="showCreateButton"
        icon="i-lucide-circle-plus"
        size="md"
        variant="outline"
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
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <li
        v-for="project in projects"
        :key="project.id"
      >
        <NuxtLink :to="`/clients/${clientId || project.clientId}/projects/${project.id}`">
          <UCard
            variant="soft"
            class="h-full hover:bg-elevated transition-all duration-200 cursor-pointer"
          >
            <div class="flex items-start gap-4 mb-2">
              <h3 class="text-xl font-semibold">
                {{ project.name }}
              </h3>
              <UBadge
                v-if="project.status || project.startDate || project.endDate"
                variant="soft"
                class="rounded-full px-3 w-fit"
                :color="getStatusColor(getProjectDisplayStatus(project))"
              >
                {{ getStatusLabel(getProjectDisplayStatus(project)) }}
              </UBadge>
            </div>
            <p class="text-gray-600">
              {{ project.description }}
            </p>
            <UButton
              v-if="showDeleteButton"
              size="sm"
              variant="soft"
              color="error"
              icon="i-lucide-trash"
              class="mt-4"
              @click.prevent="emit('delete', project.id)"
            />
          </UCard>
        </NuxtLink>
      </li>
    </TransitionGroup>

    <div
      v-else
      class="text-center py-8"
    >
      <UIcon
        name="i-lucide-folder-open"
        class="text-4xl text-gray-400 mb-2"
      />
      <p class="text-gray-600 mb-4">
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
