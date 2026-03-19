<script setup lang="ts">
import type { ProjectDocument } from '~/types'

const route = useRoute()
const clientId = computed(() => Number(route.params.id))
const projectId = computed(() => Number(route.params.projectId))

const { data, refresh } = await useFetch(`/api/projects/${projectId.value}`)
const project = computed(() => data.value)

const { data: tasksData, refresh: refreshTasks } = await useFetch(`/api/projects/${projectId.value}/tasks`)
const projectTasks = computed(() => tasksData.value?.tasks || [])

const { data: quoteDocumentsData, refresh: refreshQuoteDocuments } = await useFetch(`/api/documents/project/${projectId.value}?documentType=quote`)
const quoteDocuments = computed<ProjectDocument[]>(() => quoteDocumentsData.value?.documents || [])
const { data: invoiceDocumentsData, refresh: refreshInvoiceDocuments } = await useFetch(`/api/documents/project/${projectId.value}?documentType=invoice`)
const invoiceDocuments = computed<ProjectDocument[]>(() => invoiceDocumentsData.value?.documents || [])
const projectDocuments = computed(() => {
  return [...quoteDocuments.value, ...invoiceDocuments.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const { selectedUser, userOptions, filteredTasks } = useUserFilter(projectTasks)

const isProjectModalOpen = ref(false)
const isUploadModalOpen = ref(false)

const { deleteResource } = useDeleteConfirmation()

const onDeleteProject = async (projectId: number) => {
  await deleteResource('projet', projectId, '/api/projects', async () => {
    await navigateTo(`/clients/${clientId.value}`)
  })
}

const handleProjectChange = async () => {
  await refresh()
}

const handleDocumentsChange = async () => {
  await Promise.all([
    refreshQuoteDocuments(),
    refreshInvoiceDocuments()
  ])
}
</script>

<template>
  <div
    v-if="project"
    class="container mx-auto p-6 overflow-scroll"
  >
    <div class="mb-4">
      <UButton
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="navigateTo(`/clients/${clientId}`)"
      >
        Retour au client
      </UButton>
    </div>

    <ProjectHeader
      :project="project"
      @open-info="isProjectModalOpen = true"
      @delete="onDeleteProject"
    />
    <ProjectModal
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
      title="Ajouter un document"
      upload-label="Ajouter le document"
      @uploaded="handleDocumentsChange"
    />

    <!-- TodoList Kanban -->
    <div class="mt-8">
      <ToDoList
        :tasks="filteredTasks"
        title="Tâches du projet"
        :project-id="projectId"
        @refresh="refreshTasks"
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
      </ToDoList>
    </div>

    <div class="mt-8 flex items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">
          Documents du projet
        </h2>
        <p class="text-sm text-gray-500">
          Ajoutez un devis ou une facture depuis la modal.
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        @click="isUploadModalOpen = true"
      >
        Ajouter un document
      </UButton>
    </div>

    <UCard class="mt-6">
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-files"
              class="text-lg"
            />
            <span class="font-semibold">Documents</span>
          </div>

          <UBadge
            variant="soft"
            color="neutral"
          >
            {{ projectDocuments.length }}
          </UBadge>
        </div>
      </template>

      <div
        v-if="projectDocuments.length"
        class="space-y-3"
      >
        <div
          v-for="document in projectDocuments"
          :key="document.id"
          class="flex items-start justify-between gap-4 rounded-xl border border-default p-4"
        >
          <DocumentItem
            :document="document"
            @delete-document="handleDocumentsChange"
          />
        </div>
      </div>
      <div
        v-else
        class="flex flex-col items-center justify-center py-10 text-center text-gray-500"
      >
        <UIcon
          name="i-lucide-file-x"
          class="mb-2 text-4xl"
        />
        <p>Aucun document pour ce projet</p>
        <p class="mt-1 text-sm">
          Ajoutez un devis ou une facture depuis la modal.
        </p>
      </div>
    </UCard>
  </div>
</template>
