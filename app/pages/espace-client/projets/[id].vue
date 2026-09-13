<script setup lang="ts">
import { getErrorMessage } from '~/lib/utils'

definePageMeta({ layout: 'portal' })

const route = useRoute()
const projectId = computed(() => Number(route.params.id))

const { data, status, error, refresh } = usePortalProjects()
const isLoading = computed(() => status.value === 'pending' && !data.value)
const project = computed(() => data.value?.projects.find(p => p.id === projectId.value) ?? null)
const isNotFound = computed(() => !isLoading.value && !error.value && !!data.value && !project.value)

const {
  data: billingDocumentsData,
  status: billingDocumentsStatus,
  error: billingDocumentsError,
  refresh: refreshBillingDocuments
} = usePortalProjectBillingDocuments(projectId)
const billingDocuments = computed(() => billingDocumentsData.value?.documents ?? [])
const isBillingDocumentsLoading = computed(() => billingDocumentsStatus.value === 'pending' && !billingDocumentsData.value)

const {
  data: resourcesData,
  status: resourcesStatus,
  error: resourcesError,
  refresh: refreshResources
} = usePortalProjectResources(projectId)
const resources = computed(() => resourcesData.value?.resources ?? [])
const isResourcesLoading = computed(() => resourcesStatus.value === 'pending' && !resourcesData.value)

const {
  data: deliverablesData,
  status: deliverablesStatus,
  error: deliverablesError,
  refresh: refreshDeliverables
} = usePortalProjectDeliverables(projectId)
const deliverables = computed(() => deliverablesData.value?.deliverables ?? [])
const isDeliverablesLoading = computed(() => deliverablesStatus.value === 'pending' && !deliverablesData.value)
</script>

<template>
  <div class="w-full px-4 py-8 sm:px-8 lg:px-16 lg:py-16">
    <div
      v-if="isLoading"
      class="space-y-4"
    >
      <USkeleton class="h-10 w-72" />
      <div class="space-y-8 pt-8">
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-40"
        />
      </div>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Impossible de charger ce projet"
      :description="getErrorMessage(error, 'Merci de réessayer dans quelques instants.')"
    >
      <template #actions>
        <UButton
          color="error"
          variant="soft"
          @click="refresh()"
        >
          Réessayer
        </UButton>
      </template>
    </UAlert>

    <AppEmptyState
      v-else-if="isNotFound"
      icon="i-lucide-folder-x"
      size="lg"
      title="Projet introuvable"
      description="Ce projet n'existe pas ou n'est plus accessible."
    />

    <template v-else-if="project">
      <div class="flex flex-col gap-1 border-b border-slate-100 pb-8">
        <h1 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {{ project.name }}
        </h1>
      </div>

      <PortalProjectSection
        class="border-b border-slate-100"
        title="Documents importants"
        description="Votre proposition commerciale, votre devis et vos factures, mis à disposition par l'agence."
        error-title="Impossible de charger les documents"
        :loading="isBillingDocumentsLoading"
        :error="billingDocumentsError"
        @retry="refreshBillingDocuments()"
      >
        <PortalBillingDocumentsList :documents="billingDocuments" />
      </PortalProjectSection>

      <PortalProjectSection
        class="border-b border-slate-100"
        title="Livrables"
        description="Ce que l'agence produit pour votre projet : fichiers, liens ou notes, ajoutés au fil de son avancement."
        error-title="Impossible de charger les livrables"
        :loading="isDeliverablesLoading"
        :error="deliverablesError"
        @retry="refreshDeliverables()"
      >
        <PortalDeliverablesList :deliverables="deliverables" />
      </PortalProjectSection>

      <PortalProjectSection
        error-title="Impossible de charger les ressources"
        :loading="isResourcesLoading"
        :error="resourcesError"
        @retry="refreshResources()"
      >
        <PortalResourcesList
          :resources="resources"
          :project-id="projectId"
          @refresh="refreshResources"
        />
      </PortalProjectSection>
    </template>
  </div>
</template>
