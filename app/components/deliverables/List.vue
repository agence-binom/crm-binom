<script setup lang="ts">
import { sortByCreatedAtDesc } from '~/lib/utils'
import type { ProjectDeliverable } from '~/types'

const props = defineProps<{
  deliverables: ProjectDeliverable[]
  projectId: number
}>()

const emit = defineEmits<{
  refresh: []
}>()

const isModalOpen = ref(false)
const selectedDeliverableId = ref<number | null>(null)

const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()

const sortedDeliverables = computed(() => sortByCreatedAtDesc(props.deliverables))

const onSaved = async () => {
  emit('refresh')
}

const onDeleteDeliverable = async (deliverableId: number) => {
  await deleteResource('livrable', deliverableId, '/api/deliverables', async () => {
    emit('refresh')
  })
}

const openEditDeliverable = (deliverableId: number) => {
  selectedDeliverableId.value = deliverableId
  isModalOpen.value = true
}

const deliverableToEdit = computed(() => {
  if (!selectedDeliverableId.value) return null
  return props.deliverables.find(d => d.id === selectedDeliverableId.value) ?? null
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-slate-900">
          Livrables du projet
        </h2>
        <p class="text-sm text-gray-500">
          Maquettes, prototypes et autres livrables partagés avec le client.
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        variant="soft"
        color="neutral"
        @click="isModalOpen = true"
      >
        Ajouter un livrable
      </UButton>
    </div>

    <div
      v-if="sortedDeliverables.length"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <DeliverablesCard
        v-for="deliverable in sortedDeliverables"
        :key="deliverable.id"
        :deliverable="deliverable"
        @delete="onDeleteDeliverable"
        @edit="openEditDeliverable"
      />
    </div>

    <AppEmptyState
      v-else
      variant="compact"
      icon="i-lucide-package"
      title="Aucun livrable pour ce projet"
      description="Ajoutez un document, un lien ou une note à partager avec le client."
    />

    <DeliverablesModal
      v-model:open="isModalOpen"
      :project-id="projectId"
      :deliverable="deliverableToEdit"
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
