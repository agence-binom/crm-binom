<script setup lang="ts">
import type { ProjectResource } from '~/types'

const props = defineProps<{
  resources: ProjectResource[]
  projectId: number
}>()

const emit = defineEmits<{
  refresh: []
}>()

const isModalOpen = ref(false)

const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()

const sortedResources = computed(() => (
  [...props.resources].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
))

const onSaved = async () => {
  emit('refresh')
}

const onDeleteResource = async (resourceId: number) => {
  await deleteResource('ressource', resourceId, '/api/resources', async () => {
    emit('refresh')
  })
}
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
      class="space-y-3"
    >
      <div
        v-for="resource in sortedResources"
        :key="resource.id"
        class="flex items-start justify-between gap-4 rounded-xl border border-default p-4"
      >
        <ResourcesCard
          :resource="resource"
          @delete="onDeleteResource"
        />
      </div>
    </div>

    <div
      v-else
      class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500"
    >
      <UIcon
        name="i-lucide-folder-open"
        class="mb-2 text-4xl"
      />
      <p class="font-medium text-gray-700 dark:text-gray-200">
        Aucune ressource pour ce projet
      </p>
      <p class="mt-1 text-sm">
        Ajoutez un document, un lien ou une note utile pour ce projet.
      </p>
    </div>

    <ResourcesModal
      v-model:open="isModalOpen"
      :project-id="projectId"
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
