<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { FACTURE_NET_PORTAL_LINKS, billingDashboardStatuses } from '~/constants/billing'
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

const getProjectStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    en_cours: 'En cours',
    termine: 'Terminé',
    en_attente: 'En attente',
    annule: 'Annulé'
  }
  return labels[status] || status
}

const getBillingStatusLabel = (status: BillingDashboardStatus) => {
  const labels: Record<BillingDashboardStatus, string> = {
    all: 'Tous les documents',
    missing_quote_pdf: 'Sans devis PDF',
    missing_invoice_pdf: 'Sans facture PDF',
    missing_facturenet_link: 'Lien Facture.net manquant',
    complete: 'Complets'
  }

  return labels[status]
}

const statusOptions = billingDashboardStatuses.map(status => ({
  label: getBillingStatusLabel(status),
  value: status
}))

const selectedStatusOption = computed({
  get: () => statusOptions.find(option => option.value === statusFilter.value),
  set: (option) => {
    statusFilter.value = option?.value ?? 'all'
  }
})

const selectedProjectOption = computed({
  get: () => projectOptions.value.find(option => option.value === projectFilterId.value),
  set: (option) => {
    projectFilterId.value = option?.value ?? null
  }
})

const getCoverageSummary = (item: BillingProjectStatus, type: 'quote' | 'invoice') => {
  const coverage = type === 'quote' ? item.quoteCoverage : item.invoiceCoverage

  if (coverage.total === 0) {
    return {
      color: 'neutral' as const,
      label: type === 'quote' ? 'Manquant' : 'Manquante',
      detail: 'Aucun PDF'
    }
  }

  if (coverage.missingLinkCount > 0) {
    return {
      color: 'warning' as const,
      label: 'PDF sans lien',
      detail: `${coverage.total} PDF • ${coverage.missingLinkCount} lien${coverage.missingLinkCount > 1 ? 's' : ''} manquant${coverage.missingLinkCount > 1 ? 's' : ''}`
    }
  }

  return {
    color: 'success' as const,
    label: 'Complet',
    detail: `${coverage.total} PDF`
  }
}

const getRowStatusSummary = (item: BillingProjectStatus) => {
  if (item.isComplete) {
    return {
      color: 'success' as const,
      label: 'Complet',
      detail: 'PDF + liens présents'
    }
  }

  if (item.missingLinkCount > 0) {
    return {
      color: 'warning' as const,
      label: 'Lien manquant',
      detail: `${item.missingLinkCount} à compléter`
    }
  }

  return {
    color: 'neutral' as const,
    label: 'À compléter',
    detail: item.quoteCoverage.total === 0 && item.invoiceCoverage.total === 0
      ? 'Aucun document'
      : 'Document manquant'
  }
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
    id: 'quote',
    header: 'Devis'
  },
  {
    id: 'invoice',
    header: 'Facture'
  },
  {
    id: 'status',
    header: 'Statut'
  },
  {
    id: 'actions',
    header: 'Actions',
    meta: {
      class: {
        th: 'text-right',
        td: 'w-px'
      }
    }
  }
]

const navigateToClient = (clientId: number) => {
  navigateTo(`/clients/${clientId}`)
}

const navigateToProject = (clientId: number, projectId: number) => {
  navigateTo(`/clients/${clientId}/projects/${projectId}`)
}
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
      <div class="flex flex-wrap gap-2">
        <UButton
          variant="soft"
          color="neutral"
          icon="i-lucide-external-link"
          :href="FACTURE_NET_PORTAL_LINKS.quotes"
          target="_blank"
          rel="noopener noreferrer"
        >
          Page devis
        </UButton>
        <UButton
          variant="soft"
          color="neutral"
          icon="i-lucide-external-link"
          :href="FACTURE_NET_PORTAL_LINKS.invoices"
          target="_blank"
          rel="noopener noreferrer"
        >
          Page factures
        </UButton>
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-4 text-sm text-slate-500">
          <p>
            {{ pagination.totalItems }} projet{{ pagination.totalItems > 1 ? 's' : '' }}
          </p>
          <p v-if="isLoading">
            Mise à jour en cours...
          </p>
        </div>
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <UInput
            v-model="searchInput"
            icon="i-lucide-search"
            placeholder="Rechercher un projet ou un client..."
            size="xl"
            class="w-full md:min-w-md"
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

          <USelectMenu
            v-model="selectedStatusOption"
            :items="statusOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Filtrer par statut"
            class="w-full md:w-64"
          >
            <template #leading>
              <UIcon name="i-lucide-filter" />
            </template>
          </USelectMenu>
        </div>
      </div>

      <div
        v-if="billingProjects.length > 0"
        class="space-y-4"
      >
        <div class="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/70">
          <UTable
            :data="billingProjects"
            :columns="columns"
            sticky="header"
            class="max-h-[calc(100vh-20rem)]"
          >
            <template #project-cell="{ row }">
              <div class="min-w-48 space-y-1 py-2">
                <p class="font-semibold text-slate-900">
                  {{ row.original.project.name }}
                </p>
                <p class="text-sm text-slate-500">
                  {{ getProjectStatusLabel(getProjectDisplayStatus(row.original.project)) }} • {{ row.original.totalDocuments }} document{{ row.original.totalDocuments > 1 ? 's' : '' }}
                </p>
              </div>
            </template>

            <template #client-cell="{ row }">
              <button
                class="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-sm text-slate-600 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-100 hover:text-slate-900"
                @click="navigateToClient(row.original.project.clientId)"
              >
                <UIcon name="i-lucide-building-2" />
                {{ row.original.project.client.name }}
              </button>
            </template>

            <template #quote-cell="{ row }">
              <div class="min-w-44 space-y-1 py-2">
                <UBadge
                  variant="soft"
                  :color="getCoverageSummary(row.original, 'quote').color"
                  class="rounded-full px-3"
                >
                  {{ getCoverageSummary(row.original, 'quote').label }}
                </UBadge>
                <p class="text-sm text-slate-500">
                  {{ getCoverageSummary(row.original, 'quote').detail }}
                </p>
              </div>
            </template>

            <template #invoice-cell="{ row }">
              <div class="min-w-44 space-y-1 py-2">
                <UBadge
                  variant="soft"
                  :color="getCoverageSummary(row.original, 'invoice').color"
                  class="rounded-full px-3"
                >
                  {{ getCoverageSummary(row.original, 'invoice').label }}
                </UBadge>
                <p class="text-sm text-slate-500">
                  {{ getCoverageSummary(row.original, 'invoice').detail }}
                </p>
              </div>
            </template>

            <template #status-cell="{ row }">
              <div class="min-w-44 space-y-1 py-2">
                <UBadge
                  variant="soft"
                  :color="getRowStatusSummary(row.original).color"
                  class="rounded-full px-3"
                >
                  {{ getRowStatusSummary(row.original).label }}
                </UBadge>
                <p class="text-sm text-slate-500">
                  {{ getRowStatusSummary(row.original).detail }}
                </p>
              </div>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex justify-end gap-2">
                <UButton
                  size="sm"
                  variant="soft"
                  color="neutral"
                  icon="i-lucide-folder"
                  @click="navigateToProject(row.original.project.clientId, row.original.project.id)"
                />
                <UButton
                  size="sm"
                  variant="soft"
                  color="neutral"
                  icon="i-lucide-building-2"
                  @click="navigateToClient(row.original.project.clientId)"
                />
              </div>
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

      <div
        v-else
        class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 px-6 py-12 text-center"
      >
        <UIcon
          name="i-lucide-inbox"
          class="mb-4 text-6xl text-slate-300"
        />
        <p class="mb-2 text-xl text-slate-600">
          {{ isLoading ? 'Chargement...' : 'Aucun projet trouvé' }}
        </p>
        <p class="text-slate-500">
          {{ searchInput || statusFilter !== 'all' ? 'Essayez de modifier vos filtres' : 'Créez votre premier projet depuis la page clients' }}
        </p>
      </div>
    </div>
  </div>
</template>
