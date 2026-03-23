<script setup lang="ts">
import { FACTURE_NET_PORTAL_LINKS } from '~/constants/billing'
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

const { selectedUser, userOptions, filteredTasks } = useUserFilter(projectTasks)

const isProjectModalOpen = ref(false)
const isUploadModalOpen = ref(false)

const { deleteResource } = useDeleteConfirmation()

const quoteDocumentsMissingLinkCount = computed(() => quoteDocuments.value.filter(document => !document.externalUrl).length)
const invoiceDocumentsMissingLinkCount = computed(() => invoiceDocuments.value.filter(document => !document.externalUrl).length)

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
      title="Ajouter un devis ou une facture"
      upload-label="Importer le PDF"
      @uploaded="handleDocumentsChange"
    />

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

    <div class="mt-8 space-y-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-xl font-semibold">
            Documents de facturation
          </h2>
          <p class="text-sm text-gray-500">
            Chaque devis et chaque facture doivent avoir son PDF importé et le lien vers sa page dédiée sur Facture.net.
          </p>
        </div>

        <UButton
          icon="i-lucide-plus"
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

          <div class="flex flex-wrap gap-2">
            <UButton
              variant="soft"
              color="neutral"
              icon="i-lucide-external-link"
              :href="FACTURE_NET_PORTAL_LINKS.quotes"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ouvrir les devis
            </UButton>
            <UButton
              variant="soft"
              color="neutral"
              icon="i-lucide-external-link"
              :href="FACTURE_NET_PORTAL_LINKS.invoices"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ouvrir les factures
            </UButton>
          </div>
        </div>
      </UCard>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
            class="rounded-xl border border-dashed border-default p-6 text-center text-gray-500"
          >
            <UIcon
              name="i-lucide-file-x"
              class="mb-2 text-4xl"
            />
            <p class="font-medium text-gray-700 dark:text-gray-200">
              Aucun devis PDF importé
            </p>
            <p class="mt-1 text-sm">
              Ajoutez ici le PDF exporté depuis Facture.net pour garder une trace dans le CRM.
            </p>
          </div>
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
            class="rounded-xl border border-dashed border-default p-6 text-center text-gray-500"
          >
            <UIcon
              name="i-lucide-file-x"
              class="mb-2 text-4xl"
            />
            <p class="font-medium text-gray-700 dark:text-gray-200">
              Aucune facture PDF importée
            </p>
            <p class="mt-1 text-sm">
              Importez ici le PDF final après émission dans Facture.net, avec son lien dédié.
            </p>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
