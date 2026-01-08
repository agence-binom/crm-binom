<script setup lang="ts">
import type { Project } from '~/validation/projects'

const _props = defineProps<{
  projects: Project[]
  clientId: number
}>()

const emit = defineEmits<{
  create: []
  edit: [projectId: number]
  delete: [projectId: number]
  viewTasks: [projectId: number]
}>()

const getStatusColor = (status: string) => {
  switch (status) {
    case 'en_cours': return 'info'
    case 'termine': return 'success'
    case 'en_attente': return 'warning'
    case 'annule': return 'error'
    default: return 'neutral'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'en_cours': return 'En cours'
    case 'termine': return 'Terminé'
    case 'en_attente': return 'En attente'
    case 'annule': return 'Annulé'
    default: return status
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
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
        icon="i-lucide-circle-plus"
        size="md"
        variant="outline"
        color="neutral"
        @click="emit('create')"
      >
        Nouveau projet
      </UButton>
    </div>

    <ul
      v-if="projects.length > 0"
      class="flex items-stretch gap-4 flex-wrap"
    >
      <li
        v-for="project in projects"
        :key="project.id"
        class="min-w-sm"
      >
        <NuxtLink
          :to="`/projects/${project.id}`"
          class="min-w-sm"
        >
          <UCard
            variant="soft"
            class="h-full hover:bg-gray-100 transition-bg"
          >
            <div class="flex gap-4">
              <h3 class="text-xl font-semibold">
                {{ project.name }}
              </h3>
              <UBadge
                v-if="project.status"
                variant="soft"
                class="rounded-full px-3 w-fit"
                :color="getStatusColor(project.status)"
              >
                {{ getStatusLabel(project.status) }}
              </UBadge>
            </div>
            <p>{{ project.description }}</p>
            <UButton
              size="sm"
              variant="soft"
              color="error"
              icon="i-lucide-trash"
              class="mt-4"
              @click="emit('delete', project.id)"
            />
          </UCard>
        </NuxtLink>
      </li>
    </ul>

    <UCard v-else>
      <div class="text-center py-8">
        <UIcon
          name="i-lucide-folder-open"
          class="text-4xl text-gray-400 mb-2"
        />
        <p class="text-gray-600 mb-4">
          Aucun projet pour ce client
        </p>
        <UButton
          icon="i-lucide-plus"
          @click="emit('create')"
        >
          Créer le premier projet
        </UButton>
      </div>
    </UCard>
  </div>
</template>
