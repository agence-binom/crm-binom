<script setup lang="ts">
import { FACTURE_NET_PORTAL_LINKS } from '~/constants/billing'
import { getProjectDisplayStatus } from '~/lib/projects'
import type { ProjectDocument } from '~/types'

type CoverageStatus = 'none' | 'partial' | 'complete'

const { data: projectsData } = await useFetch('/api/projects')
const { data: documentsData } = await useFetch('/api/documents')
const { data: clientsData } = await useFetch('/api/clients')

const projects = computed(() => projectsData.value?.projects || [])
const documents = computed<ProjectDocument[]>(() => documentsData.value?.documents || [])
const clients = computed(() => clientsData.value?.clients || [])

const projectsWithClients = computed(() => {
  return projects.value.map(project => ({
    ...project,
    client: clients.value.find(client => client.id === project.clientId)
  }))
})

const billingDocuments = computed(() => {
  return documents.value.filter((document) => {
    return document.entityType === 'project'
      && (document.documentType === 'quote' || document.documentType === 'invoice')
  })
})

const getCoverage = (projectDocuments: ProjectDocument[]) => {
  const withLinkCount = projectDocuments.filter(document => Boolean(document.externalUrl)).length
  const missingLinkCount = projectDocuments.length - withLinkCount

  let status: CoverageStatus = 'none'

  if (projectDocuments.length > 0) {
    status = missingLinkCount > 0 ? 'partial' : 'complete'
  }

  return {
    total: projectDocuments.length,
    withLinkCount,
    missingLinkCount,
    status
  }
}

const projectsBillingStatus = computed(() => {
  return projectsWithClients.value.map((project) => {
    const projectDocuments = billingDocuments.value.filter(document => document.entityId === project.id)
    const quoteCoverage = getCoverage(projectDocuments.filter(document => document.documentType === 'quote'))
    const invoiceCoverage = getCoverage(projectDocuments.filter(document => document.documentType === 'invoice'))
    const missingLinkCount = quoteCoverage.missingLinkCount + invoiceCoverage.missingLinkCount

    return {
      project,
      quoteCoverage,
      invoiceCoverage,
      totalDocuments: quoteCoverage.total + invoiceCoverage.total,
      missingLinkCount,
      isComplete: quoteCoverage.status === 'complete' && invoiceCoverage.status === 'complete'
    }
  })
})

const searchQuery = ref('')
const statusFilter = ref('all')

const filteredProjects = computed(() => {
  let filtered = projectsBillingStatus.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.project.name.toLowerCase().includes(query)
      || item.project.client?.name.toLowerCase().includes(query)
    )
  }

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter((item) => {
      switch (statusFilter.value) {
        case 'missing_quote_pdf':
          return item.quoteCoverage.status === 'none'
        case 'missing_invoice_pdf':
          return item.invoiceCoverage.status === 'none'
        case 'missing_facturenet_link':
          return item.missingLinkCount > 0
        case 'complete':
          return item.isComplete
        default:
          return true
      }
    })
  }

  return filtered
})

const getCoverageColor = (status: CoverageStatus): 'neutral' | 'success' | 'warning' => {
  if (status === 'complete') return 'success'
  if (status === 'partial') return 'warning'
  return 'neutral'
}

const getCoverageLabel = (status: CoverageStatus, type: 'quote' | 'invoice') => {
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

const stats = computed(() => {
  const totalProjects = projects.value.length
  const projectsWithQuotePdf = projectsBillingStatus.value.filter(item => item.quoteCoverage.total > 0).length
  const projectsWithInvoicePdf = projectsBillingStatus.value.filter(item => item.invoiceCoverage.total > 0).length
  const documentsMissingLink = projectsBillingStatus.value.reduce((count, item) => count + item.missingLinkCount, 0)
  const completeProjects = projectsBillingStatus.value.filter(item => item.isComplete).length

  return {
    totalProjects,
    projectsWithQuotePdf,
    projectsWithInvoicePdf,
    documentsMissingLink,
    completeProjects
  }
})
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
        v-model="searchQuery"
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
    </div>

    <div
      v-if="filteredProjects.length > 0"
      class="space-y-4"
    >
      <UCard
        v-for="item in filteredProjects"
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
        Aucun projet trouvé
      </p>
      <p class="text-gray-500">
        {{ searchQuery || statusFilter !== 'all' ? 'Essayez de modifier vos filtres' : 'Créez votre premier projet depuis la page clients' }}
      </p>
    </div>
  </div>
</template>
