<script setup lang="ts">
import { FACTURE_NET_PORTAL_LINKS } from '~/constants/billing'
import type { BillingCoverageStatus, BillingProjectStatus } from '~/lib/billing'
import { getProjectDisplayStatus } from '~/lib/projects'
import type { billingDashboardStatuses } from '~/validation/billing'

type BillingStatusFilter = typeof billingDashboardStatuses[number]

const PAGE_SIZE = 12
const emptyStats = {
  totalProjects: 0,
  projectsWithQuotePdf: 0,
  projectsWithInvoicePdf: 0,
  documentsMissingLink: 0,
  completeProjects: 0
}

const emptyPagination = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 1
}

const searchInput = ref('')
const searchQuery = ref('')
const statusFilter = ref<BillingStatusFilter>('all')
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

onBeforeUnmount(() => {
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }
})

const { data, status } = await useFetch('/api/billing/projects', {
  query: computed(() => ({
    search: searchQuery.value || undefined,
    status: statusFilter.value,
    page: page.value,
    pageSize: PAGE_SIZE
  })),
  default: () => ({
    items: [],
    stats: emptyStats,
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
const stats = computed(() => data.value?.stats || emptyStats)
const pagination = computed(() => data.value?.pagination || emptyPagination)
const isLoading = computed(() => status.value === 'pending')

const getCoverageColor = (status: BillingCoverageStatus): 'neutral' | 'success' | 'warning' => {
  if (status === 'complete') return 'success'
  if (status === 'partial') return 'warning'
  return 'neutral'
}

const getCoverageLabel = (status: BillingCoverageStatus, type: 'quote' | 'invoice') => {
  if (status === 'complete') {
    return 'PDF + lien disponibles'
  }

  if (status === 'partial') {
    return 'PDF importé, lien à compléter'
  }

  return type === 'quote' ? 'Aucun devis PDF' : 'Aucune facture PDF'
}

const getProjectStatusColor = (status: string): 'neutral' | 'primary' | 'success' | 'warning' | 'error' => {
  const colors: Record<string, 'neutral' | 'primary' | 'success' | 'warning' | 'error'> = {
    en_cours: 'primary',
    termine: 'success',
    en_attente: 'warning',
    annule: 'error'
  }
  return colors[status] || 'neutral'
}

const getProjectStatusLabel = (status: string) => {
  return status.replace('_', ' ')
}

const navigateToClient = (clientId: number) => {
  navigateTo(`/clients/${clientId}`)
}

const navigateToProject = (clientId: number, projectId: number) => {
  navigateTo(`/clients/${clientId}/projects/${projectId}`)
}
</script>

<template>
  <div class="container mx-auto overflow-scroll p-6">
    <div class="mb-8">
      <h1 class="mb-2 flex items-center gap-2 text-3xl font-bold">
        <UIcon name="i-lucide-receipt" />
        Tableau de bord Facturation
      </h1>
      <p class="text-gray-600">
        Chaque devis et chaque facture doivent être suivis avec deux éléments: leur PDF importé dans le CRM et leur page dédiée sur Facture.net.
      </p>
    </div>

    <UCard
      variant="soft"
      class="mb-8"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            Accès rapides Facture.net
          </p>
          <p class="text-sm text-gray-500">
            Ouvrez d'abord le document source dans Facture.net, puis vérifiez que le PDF importé dans le CRM pointe bien vers cette page.
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
    </UCard>

    <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <UCard variant="soft">
        <div class="text-center">
          <p class="mb-1 text-sm text-gray-600">
            Projets totaux
          </p>
          <p class="text-3xl font-bold">
            {{ stats.totalProjects }}
          </p>
        </div>
      </UCard>

      <UCard variant="soft">
        <div class="text-center">
          <p class="mb-1 text-sm text-gray-600">
            Avec devis PDF
          </p>
          <p class="text-3xl font-bold text-primary-600">
            {{ stats.projectsWithQuotePdf }}
          </p>
        </div>
      </UCard>

      <UCard variant="soft">
        <div class="text-center">
          <p class="mb-1 text-sm text-gray-600">
            Avec facture PDF
          </p>
          <p class="text-3xl font-bold text-success-600">
            {{ stats.projectsWithInvoicePdf }}
          </p>
        </div>
      </UCard>

      <UCard variant="soft">
        <div class="text-center">
          <p class="mb-1 text-sm text-gray-600">
            Liens manquants
          </p>
          <p class="text-3xl font-bold text-warning-600">
            {{ stats.documentsMissingLink }}
          </p>
        </div>
      </UCard>

      <UCard variant="soft">
        <div class="text-center">
          <p class="mb-1 text-sm text-gray-600">
            Projets complets
          </p>
          <p class="text-3xl font-bold text-success-600">
            {{ stats.completeProjects }}
          </p>
        </div>
      </UCard>
    </div>

    <div class="mb-6 space-y-4">
      <UInput
        v-model="searchInput"
        icon="i-lucide-search"
        placeholder="Rechercher un projet ou client..."
        size="lg"
      />

      <div class="flex flex-wrap gap-2">
        <UButton
          :variant="statusFilter === 'all' ? 'solid' : 'soft'"
          color="neutral"
          @click="statusFilter = 'all'"
        >
          Tous
        </UButton>
        <UButton
          :variant="statusFilter === 'missing_quote_pdf' ? 'solid' : 'soft'"
          color="neutral"
          @click="statusFilter = 'missing_quote_pdf'"
        >
          Sans devis PDF
        </UButton>
        <UButton
          :variant="statusFilter === 'missing_invoice_pdf' ? 'solid' : 'soft'"
          color="neutral"
          @click="statusFilter = 'missing_invoice_pdf'"
        >
          Sans facture PDF
        </UButton>
        <UButton
          :variant="statusFilter === 'missing_facturenet_link' ? 'solid' : 'soft'"
          color="warning"
          @click="statusFilter = 'missing_facturenet_link'"
        >
          Lien Facture.net manquant
        </UButton>
        <UButton
          :variant="statusFilter === 'complete' ? 'solid' : 'soft'"
          color="success"
          @click="statusFilter = 'complete'"
        >
          Complet
        </UButton>
      </div>

      <div class="flex items-center justify-between gap-4 text-sm text-gray-500">
        <p>
          {{ pagination.totalItems }} projet{{ pagination.totalItems > 1 ? 's' : '' }}
        </p>
        <p v-if="isLoading">
          Mise à jour en cours...
        </p>
      </div>
    </div>

    <div
      v-if="billingProjects.length > 0"
      class="space-y-4"
    >
      <UCard
        v-for="item in billingProjects"
        :key="item.project.id"
        variant="soft"
        class="transition-all duration-200 hover:bg-elevated"
      >
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="mb-2 flex items-center gap-2">
                <h3 class="text-xl font-bold">
                  {{ item.project.name }}
                </h3>
                <UBadge
                  variant="soft"
                  :color="getProjectStatusColor(getProjectDisplayStatus(item.project))"
                >
                  {{ getProjectStatusLabel(getProjectDisplayStatus(item.project)) }}
                </UBadge>
              </div>

              <button
                v-if="item.project.client"
                class="flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-primary-600"
                @click="navigateToClient(item.project.clientId)"
              >
                <UIcon name="i-lucide-building-2" />
                {{ item.project.client.name }}
              </button>
            </div>

            <UBadge
              variant="soft"
              :color="item.isComplete ? 'success' : item.missingLinkCount > 0 ? 'warning' : 'neutral'"
            >
              {{ item.totalDocuments }} document{{ item.totalDocuments > 1 ? 's' : '' }}
            </UBadge>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div class="rounded-lg bg-white/50 p-4 dark:bg-gray-900/50">
              <div class="mb-2 flex items-center justify-between">
                <h4 class="flex items-center gap-2 font-semibold">
                  <UIcon name="i-lucide-file-text" />
                  Devis
                </h4>
                <UBadge
                  variant="soft"
                  size="xs"
                  color="primary"
                >
                  {{ item.quoteCoverage.total }} PDF
                </UBadge>
              </div>

              <UBadge
                variant="soft"
                :color="getCoverageColor(item.quoteCoverage.status)"
                class="w-full justify-center py-2"
              >
                {{ getCoverageLabel(item.quoteCoverage.status, 'quote') }}
              </UBadge>

              <div class="mt-3 space-y-1 text-sm text-gray-600">
                <p>{{ item.quoteCoverage.withLinkCount }} lien{{ item.quoteCoverage.withLinkCount > 1 ? 's' : '' }} Facture.net</p>
                <p
                  v-if="item.quoteCoverage.missingLinkCount > 0"
                  class="text-warning-700 dark:text-warning-300"
                >
                  {{ item.quoteCoverage.missingLinkCount }} lien{{ item.quoteCoverage.missingLinkCount > 1 ? 's' : '' }} à compléter
                </p>
                <p
                  v-else-if="item.quoteCoverage.total === 0"
                  class="text-gray-500"
                >
                  Placeholder utile: le devis PDF manque encore.
                </p>
              </div>
            </div>

            <div class="rounded-lg bg-white/50 p-4 dark:bg-gray-900/50">
              <div class="mb-2 flex items-center justify-between">
                <h4 class="flex items-center gap-2 font-semibold">
                  <UIcon name="i-lucide-file-minus" />
                  Factures
                </h4>
                <UBadge
                  variant="soft"
                  size="xs"
                  color="success"
                >
                  {{ item.invoiceCoverage.total }} PDF
                </UBadge>
              </div>

              <UBadge
                variant="soft"
                :color="getCoverageColor(item.invoiceCoverage.status)"
                class="w-full justify-center py-2"
              >
                {{ getCoverageLabel(item.invoiceCoverage.status, 'invoice') }}
              </UBadge>

              <div class="mt-3 space-y-1 text-sm text-gray-600">
                <p>{{ item.invoiceCoverage.withLinkCount }} lien{{ item.invoiceCoverage.withLinkCount > 1 ? 's' : '' }} Facture.net</p>
                <p
                  v-if="item.invoiceCoverage.missingLinkCount > 0"
                  class="text-warning-700 dark:text-warning-300"
                >
                  {{ item.invoiceCoverage.missingLinkCount }} lien{{ item.invoiceCoverage.missingLinkCount > 1 ? 's' : '' }} à compléter
                </p>
                <p
                  v-else-if="item.invoiceCoverage.total === 0"
                  class="text-gray-500"
                >
                  Placeholder utile: la facture PDF manque encore.
                </p>
              </div>
            </div>

            <div class="rounded-lg bg-white/50 p-4 dark:bg-gray-900/50">
              <div class="mb-2 flex items-center justify-between">
                <h4 class="flex items-center gap-2 font-semibold">
                  <UIcon name="i-lucide-folders" />
                  Résumé
                </h4>
              </div>

              <div class="space-y-2">
                <div>
                  <p class="text-xs text-gray-600">
                    Complétude
                  </p>
                  <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {{ item.isComplete ? 'PDF + liens Facture.net présents' : 'Des éléments restent à compléter' }}
                  </p>
                </div>

                <div>
                  <p class="text-xs text-gray-600">
                    Point d'attention
                  </p>
                  <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {{
                      item.missingLinkCount > 0
                        ? `${item.missingLinkCount} lien${item.missingLinkCount > 1 ? 's' : ''} Facture.net manquant${item.missingLinkCount > 1 ? 's' : ''}`
                        : item.totalDocuments > 0
                          ? 'Aucun lien manquant'
                          : 'Aucun document de facturation importé'
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-2 dark:border-gray-700">
            <UButton
              size="sm"
              variant="soft"
              color="neutral"
              icon="i-lucide-folder"
              @click="navigateToProject(item.project.clientId, item.project.id)"
            >
              Voir le projet
            </UButton>
            <UButton
              size="sm"
              variant="soft"
              color="neutral"
              icon="i-lucide-building-2"
              @click="navigateToClient(item.project.clientId)"
            >
              Voir le client
            </UButton>
          </div>
        </div>
      </UCard>

      <div
        v-if="pagination.totalPages > 1"
        class="flex flex-col items-center justify-between gap-3 rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-800 md:flex-row"
      >
        <p class="text-gray-500">
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
      class="py-12 text-center"
    >
      <UIcon
        name="i-lucide-inbox"
        class="mb-4 text-6xl text-gray-400"
      />
      <p class="mb-2 text-xl text-gray-600">
        {{ isLoading ? 'Chargement...' : 'Aucun projet trouvé' }}
      </p>
      <p class="text-gray-500">
        {{ searchInput || statusFilter !== 'all' ? 'Essayez de modifier vos filtres' : 'Créez votre premier projet depuis la page clients' }}
      </p>
    </div>
  </div>
</template>
