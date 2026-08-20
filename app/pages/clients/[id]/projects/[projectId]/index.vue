<script setup lang="ts">
import type { ProjectDocument, ProjectResource, Task, User } from '~/types'

const route = useRoute()
const clientId = computed(() => Number(route.params.id))
const projectId = computed(() => Number(route.params.projectId))

const { data, error, refresh } = await useFetch(`/api/projects/${projectId.value}/dashboard`)
const project = computed(() => data.value?.project)
const projectTasks = computed<Task[]>(() => (data.value?.tasks as Task[] | undefined) || [])
const quoteDocuments = computed<ProjectDocument[]>(() => (data.value?.documents?.quote as ProjectDocument[] | undefined) || [])
const invoiceDocuments = computed<ProjectDocument[]>(() => (data.value?.documents?.invoice as ProjectDocument[] | undefined) || [])
const commercialProposalDocuments = computed<ProjectDocument[]>(() => (data.value?.documents?.commercial_proposal as ProjectDocument[] | undefined) || [])
const projectResources = computed<ProjectResource[]>(() => (data.value?.resources as ProjectResource[] | undefined) || [])
const availableUsers = computed<User[]>(() => data.value?.users || [])
const projectOptions = computed(() => data.value?.projectOptions || [])

const { selectedUser, userOptions, filteredTasks } = useUserFilter(projectTasks, availableUsers)

const isProjectModalOpen = ref(false)
const isUploadModalOpen = ref(false)

const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()
const { setArchived } = useArchiveAction()

const quoteDocumentsMissingLinkCount = computed(() => quoteDocuments.value.filter(document => !document.externalUrl).length)
const invoiceDocumentsMissingLinkCount = computed(() => invoiceDocuments.value.filter(document => !document.externalUrl).length)

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
  await deleteResource('document', documentId, '/api/documents', async () => {
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
      :entity-id="project.id"
      entity-type="project"
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

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-file-minus"
                  class="text-lg"
                />
                <span class="font-semibold">Propositions commerciales</span>
              </div>

              <div class="flex items-center gap-2">
                <UBadge
                  variant="soft"
                  color="success"
                >
                  {{ commercialProposalDocuments.length }} PDF
                </UBadge>
              </div>
            </div>
          </template>

          <div
            v-if="commercialProposalDocuments.length"
            class="space-y-3"
          >
            <div
              v-for="document in commercialProposalDocuments"
              :key="document.id"
              class="group flex items-start justify-between gap-4 rounded-xl border border-default p-4"
            >
              <DocumentItem
                :document="document"
                @delete-document="onDeleteDocument"
                @update-document="handleDocumentsChange"
              />
            </div>
          </div>

          <AppEmptyState
            v-else
            variant="compact"
            icon="i-lucide-file-x"
            title="Aucune proposition commerciale"
          />
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-file-text"
                  class="text-lg"
                />
                <span class="font-semibold">Devis</span>
              </div>

              <div class="flex items-center gap-2">
                <UBadge
                  variant="soft"
                  color="primary"
                >
                  {{ quoteDocuments.length }} PDF
                </UBadge>
                <UBadge
                  v-if="quoteDocumentsMissingLinkCount > 0"
                  variant="soft"
                  color="warning"
                >
                  {{ quoteDocumentsMissingLinkCount }} lien manquant
                </UBadge>
              </div>
            </div>
          </template>

          <div
            v-if="quoteDocuments.length"
            class="space-y-3"
          >
            <div
              v-for="document in quoteDocuments"
              :key="document.id"
              class="group flex items-start justify-between gap-4 rounded-xl border border-default p-4"
            >
              <DocumentItem
                :document="document"
                @delete-document="onDeleteDocument"
                @update-document="handleDocumentsChange"
              />
            </div>
          </div>

          <AppEmptyState
            v-else
            variant="compact"
            icon="i-lucide-file-x"
            title="Aucun devis"
            description="Ajoutez ici le PDF exporté depuis Facture.net pour garder une trace."
          />
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-file-minus"
                  class="text-lg"
                />
                <span class="font-semibold">Factures</span>
              </div>

              <div class="flex items-center gap-2">
                <UBadge
                  variant="soft"
                  color="success"
                >
                  {{ invoiceDocuments.length }} PDF
                </UBadge>
                <UBadge
                  v-if="invoiceDocumentsMissingLinkCount > 0"
                  variant="soft"
                  color="warning"
                >
                  {{ invoiceDocumentsMissingLinkCount }} lien manquant
                </UBadge>
              </div>
            </div>
          </template>

          <div
            v-if="invoiceDocuments.length"
            class="space-y-3"
          >
            <div
              v-for="document in invoiceDocuments"
              :key="document.id"
              class="group flex items-start justify-between gap-4 rounded-xl border border-default p-4"
            >
              <DocumentItem
                :document="document"
                @delete-document="onDeleteDocument"
                @update-document="handleDocumentsChange"
              />
            </div>
          </div>

          <AppEmptyState
            v-else
            variant="compact"
            icon="i-lucide-file-x"
            title="Aucune facture"
            description="Importez ici le PDF final après émission dans Facture.net, avec son lien dédié."
          />
        </UCard>
      </div>
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
