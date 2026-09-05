<script setup lang="ts">
import { sortByCreatedAtDesc } from '~/lib/utils'
import type { ProjectResource } from '~/types'

const props = defineProps<{
  resources: ProjectResource[]
  projectId: number
}>()

const emit = defineEmits<{
  refresh: []
}>()

const isModalOpen = ref(false)

const sortedResources = computed(() => sortByCreatedAtDesc(props.resources))

const onSaved = () => emit('refresh')
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-slate-900">
        Ressources
      </h2>
      <UButton
        icon="i-lucide-circle-plus"
        color="neutral"
        variant="soft"
        @click="isModalOpen = true"
      >
        Nouvelle ressource
      </UButton>
    </div>

    <div
      v-if="sortedResources.length"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="resource in sortedResources"
        :key="resource.id"
        class="flex items-start justify-between gap-4 rounded-xl border border-default p-4"
      >
        <ResourcesCard :resource="resource">
          <template #actions />
        </ResourcesCard>
      </div>
    </div>

    <AppEmptyState
      v-else
      icon="i-lucide-folder-open"
      title="Aucune ressource pour le moment"
      description="Les fichiers et ressources partagés par l'agence apparaîtront ici."
    />

    <PortalResourceModal
      v-model:open="isModalOpen"
      :project-id="projectId"
      @saved="onSaved"
    />
  </div>
</template>
