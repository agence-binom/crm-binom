<script setup lang="ts">
const route = useRoute()
const clientId = computed(() => Number(route.params.id))
const projectId = computed(() => Number(route.params.projectId))

const { data, refresh } = await useFetch(`/api/projects/${projectId.value}`)
const project = computed(() => data.value)

const { data: tasksData, refresh: refreshTasks } = await useFetch(`/api/projects/${projectId.value}/tasks`)
const projectTasks = computed(() => tasksData.value?.tasks || [])

const { data: quoteDocumentsData, refresh: refreshQuoteDocuments } = await useFetch(`/api/documents/project/${projectId.value}?documentType=quote`)
const quoteDocuments = computed(() => quoteDocumentsData.value?.documents || [])

const { data: invoiceDocumentsData, refresh: refreshInvoiceDocuments } = await useFetch(`/api/documents/project/${projectId.value}?documentType=invoice`)
const invoiceDocuments = computed(() => invoiceDocumentsData.value?.documents || [])

const { selectedUser, userOptions, filteredTasks } = useUserFilter(projectTasks)

const isProjectModalOpen = ref(false)

const { deleteResource } = useDeleteConfirmation()

const onDeleteProject = async (projectId: number) => {
  await deleteResource('projet', projectId, '/api/projects', async () => {
    await navigateTo(`/clients/${clientId.value}`)
  })
}

const handleProjectChange = async () => {
  await refresh()
}

const handleQuoteDocumentsChange = async () => {
  await refreshQuoteDocuments()
}

const handleInvoiceDocumentsChange = async () => {
  await refreshInvoiceDocuments()
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

    <!-- Facturation -->
    <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <DocumentUpload
          entity-type="project"
          :entity-id="project.id"
          document-type="quote"
          title="Devis"
          upload-label="Ajouter un devis"
          empty-message="Aucun devis téléversé pour ce projet."
          :documents="quoteDocuments"
          @uploaded="handleQuoteDocumentsChange"
          @deleted="handleQuoteDocumentsChange"
        />
      </div>

      <div>
        <DocumentUpload
          entity-type="project"
          :entity-id="project.id"
          document-type="invoice"
          title="Factures"
          upload-label="Ajouter une facture"
          empty-message="Aucune facture téléversée pour ce projet."
          :documents="invoiceDocuments"
          @uploaded="handleInvoiceDocumentsChange"
          @deleted="handleInvoiceDocumentsChange"
        />
      </div>
    </div>

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
  </div>
</template>
