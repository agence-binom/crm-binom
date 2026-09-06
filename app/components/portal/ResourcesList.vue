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

const { data: session } = usePortalSession()
const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()

const isModalOpen = ref(false)
const selectedResourceId = ref<number | null>(null)

const sortedResources = computed(() => sortByCreatedAtDesc(props.resources))

// A resource is only editable/deletable by the portal contact who created it - resources added by
// the agency (createdByContactId null) or by another contact stay read-only for this client.
const isOwnResource = (resource: ProjectResource) => resource.createdByContactId === session.value?.contact.id

const onSaved = () => emit('refresh')

const onDeleteResource = async (resourceId: number) => {
  await deleteResource('ressource', resourceId, '/api/portal/resources', async () => {
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

const onModalOpenChange = (open: boolean) => {
  isModalOpen.value = open
  if (!open) selectedResourceId.value = null
}
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
      <ResourcesCard
        v-for="resource in sortedResources"
        :key="resource.id"
        :resource="resource"
        :readonly="!isOwnResource(resource)"
        @edit="openEditResource"
        @delete="onDeleteResource"
      />
    </div>

    <AppEmptyState
      v-else
      icon="i-lucide-folder-open"
      title="Aucune ressource pour le moment"
      description="Les fichiers et ressources partagés par l'agence apparaîtront ici."
    />

    <PortalResourceModal
      :open="isModalOpen"
      :project-id="projectId"
      :resource="resourceToEdit"
      @update:open="onModalOpenChange"
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
