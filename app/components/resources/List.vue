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
const selectedResourceId = ref<number | null>(null)

const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()

const sortedResources = computed(() => sortByCreatedAtDesc(props.resources))

const onSaved = async () => {
  emit('refresh')
}

const onDeleteResource = async (resourceId: number) => {
  await deleteResource('ressource', resourceId, '/api/resources', async () => {
    emit('refresh')
  })
}

const openEditResource = (resourceId: number) => {
  selectedResourceId.value = resourceId
  isModalOpen.value = true
}

const resourceToEdit = computed(() => {
  if (!selectedResourceId.value) return null
  return props.resources.find(r => r.id === selectedResourceId.value) ?? null
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-slate-900">
          Ressources du projet
        </h2>
        <p class="text-sm text-gray-500">
          Documents, liens et notes utiles pour ce projet.
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        variant="soft"
        color="neutral"
        @click="isModalOpen = true"
      >
        Ajouter une ressource
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
        <ResourcesCard
          :resource="resource"
          @delete="onDeleteResource"
          @edit="openEditResource"
        />
      </div>
    </div>

    <AppEmptyState
      v-else
      variant="compact"
      icon="i-lucide-folder-open"
      title="Aucune ressource pour ce projet"
      description="Ajoutez un document, un lien ou une note utile pour ce projet."
    />

    <ResourcesModal
      v-model:open="isModalOpen"
      :project-id="projectId"
      :resource="resourceToEdit"
      @saved="onSaved"
    />

    <ConfirmModal
      :open="confirmModalOpen"
      title="Confirmer la suppression"
      :message="confirmModalMessage"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </div>
</template>
