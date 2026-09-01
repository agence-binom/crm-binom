<script setup lang="ts">
import { annotateDocumentLifecycle } from '~/lib/documents'
import type { BillingDocumentRecord, ProjectResource, Task, User } from '~/types'

const route = useRoute()
const clientId = computed(() => Number(route.params.id))
const projectId = computed(() => Number(route.params.projectId))

const { data, error, refresh } = await useFetch(`/api/projects/${projectId.value}/dashboard`)
const project = computed(() => data.value?.project)
const projectTasks = computed<Task[]>(() => (data.value?.tasks as Task[] | undefined) || [])
const quoteDocuments = computed<BillingDocumentRecord[]>(() => (data.value?.documents?.quote as BillingDocumentRecord[] | undefined) || [])
const invoiceDocuments = computed<BillingDocumentRecord[]>(() => (data.value?.documents?.invoice as BillingDocumentRecord[] | undefined) || [])
const commercialProposalDocuments = computed<BillingDocumentRecord[]>(() => (data.value?.documents?.commercial_proposal as BillingDocumentRecord[] | undefined) || [])
const projectResources = computed<ProjectResource[]>(() => (data.value?.resources as ProjectResource[] | undefined) || [])
const availableUsers = computed<User[]>(() => data.value?.users || [])
const projectOptions = computed(() => data.value?.projectOptions || [])

const { selectedUser, userOptions, filteredTasks } = useUserFilter(projectTasks, availableUsers)

const isProjectModalOpen = ref(false)
const isUploadModalOpen = ref(false)

const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()
const { setArchived } = useArchiveAction()

const billingDocuments = computed(() => annotateDocumentLifecycle([
  ...commercialProposalDocuments.value.map(document => ({ ...document, type: 'commercial_proposal' as const })),
  ...quoteDocuments.value.map(document => ({ ...document, type: 'quote' as const })),
  ...invoiceDocuments.value.map(document => ({ ...document, type: 'invoice' as const }))
]))

const onDeleteProject = async (projectId: number) => {
  await deleteResource('projet', projectId, '/api/projects', async () => {
    await navigateTo(`/clients/${clientId.value}`)
  })
}

const onArchiveProject = async (projectId: number) => {
  await setArchived('projet', projectId, '/api/projects', true, refresh)
}

const onRestoreProject = async (projectId: number) => {
  await setArchived('projet', projectId, '/api/projects', false, refresh)
}

const handleProjectChange = async () => {
  await refresh()
}

const handleDocumentsChange = async () => {
  await refresh()
}

const onDeleteDocument = async (documentId: number) => {
  await deleteResource('document', documentId, '/api/billing-documents', async () => {
    await refresh()
  })
}
</script>

<template>
  <div
    v-if="project"
    class="container mx-auto p-6 overflow-scroll"
  >
    <AppBackButton
      :to="`/clients/${clientId}`"
      label="Retour au client"
    />

    <ProjectsHeader
      :project="project"
      :client="project.client"
      @open-info="isProjectModalOpen = true"
      @delete="onDeleteProject"
      @archive="onArchiveProject"
      @restore="onRestoreProject"
    />

    <ProjectsModal
      v-model:open="isProjectModalOpen"
      :project-id="project.id"
      :project="project"
      :client-id="project.clientId"
      @saved="handleProjectChange"
    />

    <UploadModal
      v-model:open="isUploadModalOpen"
      :project-id="project.id"
      title="Ajouter un document commercial"
      upload-label="Importer le PDF"
      @uploaded="handleDocumentsChange"
    />

    <div class="mt-8">
      <TasksToDoList
        :tasks="filteredTasks"
        title="Tâches du projet"
        title-heading="h2"
        :project-id="projectId"
        :available-projects="projectOptions"
        :available-users="availableUsers"
        @refresh="refresh"
      >
        <template #filters>
          <USelectMenu
            v-model="selectedUser"
            :items="userOptions"
            placeholder="Filtrer par utilisateur"
            value-attribute="value"
            option-attribute="label"
            class="w-64"
          >
            <template #leading>
              <UIcon name="i-lucide-filter" />
            </template>
          </USelectMenu>
        </template>
      </TasksToDoList>
    </div>

    <div class="mt-8">
      <ResourcesList
        :resources="projectResources"
        :project-id="projectId"
        @refresh="refresh"
      />
    </div>

    <div class="mt-8 space-y-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-slate-900">
            Documents de facturation
          </h2>
          <p class="text-sm text-gray-500">
            Chaque devis et chaque facture doivent avoir son PDF importé et le lien vers sa page dédiée sur Facture.net.
          </p>
        </div>

        <UButton
          icon="i-lucide-plus"
          variant="soft"
          color="neutral"
          @click="isUploadModalOpen = true"
        >
          Ajouter un document
        </UButton>
      </div>

      <UCard variant="soft">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Accès rapides Facture.net
            </p>
            <p class="text-sm text-gray-500">
              Utilisez Facture.net pour éditer le document source, puis importez ici le PDF correspondant.
            </p>
          </div>

          <BillingFactureNetPortalLinks />
        </div>
      </UCard>

      <BillingHorizontalTimeline
        :documents="billingDocuments"
        @delete-document="onDeleteDocument"
        @update-document="handleDocumentsChange"
      />
    </div>

    <ConfirmModal
      :open="confirmModalOpen"
      title="Confirmer la suppression"
      :message="confirmModalMessage"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </div>

  <div
    v-else-if="error"
    class="container mx-auto p-6"
  >
    <UAlert
      icon="i-lucide-circle-alert"
      color="error"
      variant="soft"
      title="Impossible de charger le projet"
      :description="error.statusMessage || error.message || 'Une erreur est survenue lors du chargement de ce projet.'"
    >
      <template #actions>
        <UButton
          variant="soft"
          color="error"
          icon="i-lucide-rotate-cw"
          @click="refresh()"
        >
          Réessayer
        </UButton>
      </template>
    </UAlert>
  </div>
</template>
