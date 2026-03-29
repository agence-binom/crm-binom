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

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return null
  return new Date(date).toLocaleDateString('fr-FR')
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="showHeader"
      class="flex items-center justify-between gap-4 border-b border-slate-100 pb-4"
    >
      <h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
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
          <UCard
            class="relative h-full rounded-[1.35rem] border-0 bg-white/90 shadow-sm ring-1 ring-gray-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="space-y-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <UBadge
                      v-if="project.status || project.startDate || project.endDate"
                      variant="soft"
                      class="rounded-full px-3"
                      :color="getStatusColor(getProjectDisplayStatus(project))"
                    >
                      {{ getStatusLabel(getProjectDisplayStatus(project)) }}
                    </UBadge>
                  </div>

                  <h3 class="text-lg font-semibold tracking-tight text-slate-900">
                    {{ project.name }}
                  </h3>
                </div>

                <UButton
                  v-if="showDeleteButton"
                  size="sm"
                  variant="soft"
                  color="error"
                  icon="i-lucide-trash"
                  class="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                  @click.prevent.stop="emit('delete', project.id)"
                />
              </div>

              <p
                v-if="project.description"
                class="line-clamp-3 text-sm leading-6 text-slate-600"
              >
                {{ project.description }}
              </p>
              <p
                v-else
                class="text-sm italic text-slate-400"
              >
                Aucune description
              </p>

              <div
                v-if="project.startDate || project.endDate"
                class="flex flex-wrap gap-2 text-sm text-slate-500"
              >
                <div
                  v-if="project.startDate"
                  class="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-inset ring-slate-200"
                >
                  <UIcon name="i-lucide-calendar-range" />
                  {{ formatDate(project.startDate) }}
                </div>
                <div
                  v-if="project.endDate"
                  class="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-inset ring-slate-200"
                >
                  <UIcon name="i-lucide-flag" />
                  {{ formatDate(project.endDate) }}
                </div>
              </div>
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
              aria-label="Supprimer le projet"
              @click.prevent="emit('delete', project.id)"
            />
          </UCard>
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
