<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui'
import { billingDashboardStatuses } from '~/constants/billing'
import type { BillingDashboardStatus } from '~/constants/billing'
import type { BillingProjectStatus } from '~/lib/billing'
import { getProjectDisplayStatus } from '~/lib/projects'

const PAGE_SIZE = 12
const emptyPagination = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 1
}

const searchInput = ref('')
const searchQuery = ref('')
const statusFilter = ref<BillingDashboardStatus>('all')
const projectFilterId = ref<number | null>(null)
const page = ref(1)

let searchDebounce: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (value) => {
  page.value = 1

  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }

  searchDebounce = setTimeout(() => {
    searchQuery.value = value.trim()
  }, 250)
})

watch(statusFilter, () => {
  page.value = 1
})

watch(projectFilterId, () => {
  page.value = 1
})

onBeforeUnmount(() => {
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }
})

const { data, status } = await useFetch('/api/billing/projects', {
  query: computed(() => ({
    search: searchQuery.value || undefined,
    projectId: projectFilterId.value || undefined,
    status: statusFilter.value,
    page: page.value,
    pageSize: PAGE_SIZE
  })),
  default: () => ({
    items: [],
    projectOptions: [],
    pagination: emptyPagination
  })
})

watch(
  () => data.value?.pagination.page,
  (serverPage) => {
    if (serverPage && serverPage !== page.value) {
      page.value = serverPage
    }
  }
)

const billingProjects = computed<BillingProjectStatus[]>(() => data.value?.items || [])
const projectOptions = computed(() => [
  { label: 'Tous les projets', value: null as number | null },
  ...((data.value?.projectOptions as Array<{ label: string, value: number }> | undefined) ?? [])
])
const pagination = computed(() => data.value?.pagination || emptyPagination)
const isLoading = computed(() => status.value === 'pending')

const hasActiveFilters = computed(() =>
  Boolean(searchInput.value.trim()) || statusFilter.value !== 'all' || projectFilterId.value !== null
)

const isAllCaughtUp = computed(() =>
  !isLoading.value
  && statusFilter.value === 'incomplete'
  && !searchInput.value.trim()
  && projectFilterId.value === null
  && billingProjects.value.length === 0
)

const { getStatusColor, getStatusLabel } = useStatusHelpers()

const selectedProjectOption = computed({
  get: () => projectOptions.value.find(option => option.value === projectFilterId.value),
  set: (option) => {
    projectFilterId.value = option?.value ?? null
  }
})

const statusFilterLabels: Record<BillingDashboardStatus, string> = {
  all: 'Tous les statuts',
  incomplete: 'Incomplet',
  missing_quote_pdf: 'Devis manquant',
  missing_invoice_pdf: 'Facture manquante',
  missing_proposal_pdf: 'Proposition manquante',
  missing_facturenet_link: 'Lien Facture.net manquant',
  complete: 'Complet'
}

const statusFilterOptions = billingDashboardStatuses.map(status => ({
  label: statusFilterLabels[status],
  value: status
}))

const isDetailPanelOpen = ref(false)
const selectedProject = ref<BillingProjectStatus | null>(null)

const onRowClick = (event: Event, row: TableRow<BillingProjectStatus>) => {
  if ((event.target as HTMLElement).closest('a')) return

  selectedProject.value = row.original
  isDetailPanelOpen.value = true
}

const columns: TableColumn<BillingProjectStatus>[] = [
  {
    id: 'project',
    header: 'Projet'
  },
  {
    id: 'client',
    header: 'Client'
  },
  {
    id: 'progress',
    header: 'Avancement'
  }
]
</script>

<template>
  <div class="container mx-auto space-y-8 p-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="space-y-2 border-b border-slate-100 pb-5">
        <h1 class="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
          <UIcon
            name="i-lucide-receipt"
            class="text-slate-700"
          />
          Tableau de bord Facturation
        </h1>
        <p class="text-sm text-slate-500">
          Une vue simple de l’état devis / facture pour chaque projet.
        </p>
      </div>
      <BillingFactureNetPortalLinks />
    </div>

    <div class="space-y-2">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          v-if="isLoading"
          class="flex items-center gap-2 text-sm text-slate-500"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="animate-spin"
          />
          Mise à jour en cours...
        </div>
        <div class="w-full flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <UInput
            v-model="searchInput"
            icon="i-lucide-search"
            placeholder="Rechercher un projet ou un client..."
            size="md"
            class="flex-1"
          />

          <USelectMenu
            v-model="selectedProjectOption"
            :items="projectOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Filtrer par projet"
            class="w-full md:w-64"
          >
            <template #leading>
              <UIcon name="i-lucide-folder-search" />
            </template>
          </USelectMenu>

          <USelect
            v-model="statusFilter"
            :items="statusFilterOptions"
            value-attribute="value"
            option-attribute="label"
            class="w-full md:w-56"
          >
            <template #leading>
              <UIcon name="i-lucide-filter" />
            </template>
          </USelect>
        </div>
      </div>

      <div
        v-if="billingProjects.length > 0"
        class="space-y-4"
      >
        <div
          class="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/70 transition-opacity"
          :class="{ 'pointer-events-none opacity-60': isLoading }"
        >
          <UTable
            :data="billingProjects"
            :columns="columns"
            sticky="header"
            class="max-h-[calc(100vh-20rem)]"
            :ui="{ tr: 'cursor-pointer', td: 'p-2' }"
            @select="onRowClick"
          >
            <template #project-cell="{ row }">
              <AppLink
                :to="`/clients/${row.original.project.clientId}/projects/${row.original.project.id}`"
                class="group min-w-48"
              >
                <div class="space-y-1">
                  <p class="flex items-center gap-1.5 font-semibold text-slate-900">
                    {{ row.original.project.name }}
                  </p>
                  <UBadge
                    size="sm"
                    variant="soft"
                    :color="getStatusColor(getProjectDisplayStatus(row.original.project))"
                    class="rounded-full px-2"
                  >
                    {{ getStatusLabel(getProjectDisplayStatus(row.original.project)) }}
                  </UBadge>
                </div>
              </AppLink>
            </template>

            <template #client-cell="{ row }">
              <NuxtLink
                :to="`/clients/${row.original.project.client.id}`"
                class="inline-flex max-w-full items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100"
              >
                <UIcon
                  name="i-lucide-building-2"
                  class="shrink-0"
                />
                <span class="truncate">{{ row.original.project.client.name }}</span>
              </NuxtLink>
            </template>

            <template #progress-cell="{ row }">
              <BillingRowTimeline :documents="row.original.documents" />
            </template>
          </UTable>
        </div>

        <div
          v-if="pagination.totalPages > 1"
          class="flex flex-col items-center justify-between gap-3 rounded-[1.35rem] border border-slate-200 bg-white/90 p-4 text-sm shadow-sm ring-1 ring-slate-200/70 md:flex-row"
        >
          <p class="text-slate-500">
            Page {{ pagination.page }} sur {{ pagination.totalPages }}
          </p>

          <div class="flex gap-2">
            <UButton
              variant="soft"
              color="neutral"
              icon="i-lucide-chevron-left"
              :disabled="pagination.page <= 1 || isLoading"
              @click="page = Math.max(1, pagination.page - 1)"
            >
              Précédent
            </UButton>
            <UButton
              variant="soft"
              color="neutral"
              trailing-icon="i-lucide-chevron-right"
              :disabled="pagination.page >= pagination.totalPages || isLoading"
              @click="page = Math.min(pagination.totalPages, pagination.page + 1)"
            >
              Suivant
            </UButton>
          </div>
        </div>
      </div>

      <AppEmptyState
        v-else
        :icon="isAllCaughtUp ? 'i-lucide-circle-check' : 'i-lucide-inbox'"
        :icon-class="isAllCaughtUp ? 'text-success-400' : 'text-slate-300'"
        size="lg"
        :title="isLoading ? 'Chargement...' : (isAllCaughtUp ? 'Tous les documents sont à jour' : 'Aucun projet trouvé')"
        :description="isLoading || isAllCaughtUp
          ? 'Aucun devis, proposition ou facture manquant pour le moment.'
          : (hasActiveFilters ? 'Essayez de modifier vos filtres' : 'Créez votre premier projet depuis la page clients')"
      >
        <template
          v-if="!isLoading && statusFilter !== 'all'"
          #actions
        >
          <UButton
            variant="soft"
            color="neutral"
            @click="statusFilter = 'all'"
          >
            Voir tous les projets
          </UButton>
        </template>
      </AppEmptyState>
    </div>

    <BillingProjectDetailPanel
      v-model:open="isDetailPanelOpen"
      :project="selectedProject"
    />
  </div>
</template>
