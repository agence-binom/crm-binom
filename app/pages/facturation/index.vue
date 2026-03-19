<script setup lang="ts">
const { data: projectsData } = await useFetch('/api/projects')
const { data: documentsData } = await useFetch('/api/documents')
const { data: clientsData } = await useFetch('/api/clients')

const projects = computed(() => projectsData.value?.projects || [])
const documents = computed(() => documentsData.value?.documents || [])
const clients = computed(() => clientsData.value?.clients || [])

// Enrichir les projets avec les infos client
const projectsWithClients = computed(() => {
  return projects.value.map(project => ({
    ...project,
    client: clients.value.find(c => c.id === project.clientId)
  }))
})

const billingDocuments = computed(() => {
  return documents.value.filter((document) => {
    return document.entityType === 'project'
      && (document.documentType === 'quote' || document.documentType === 'invoice')
  })
})

const projectsBillingStatus = computed(() => {
  return projectsWithClients.value.map((project) => {
    const projectDocuments = billingDocuments.value.filter(document => document.entityId === project.id)
    const projectQuotes = projectDocuments.filter(document => document.documentType === 'quote')
    const projectInvoices = projectDocuments.filter(document => document.documentType === 'invoice')

    const quoteStatus = projectQuotes.length > 0 ? 'available' : 'none'
    const invoiceStatus = projectInvoices.length > 0 ? 'available' : 'none'

    return {
      project,
      quoteStatus,
      quotesCount: projectQuotes.length,
      invoicesCount: projectInvoices.length,
      invoiceStatus
    }
  })
})

// Filtres
const searchQuery = ref('')
const statusFilter = ref<string>('all')

const filteredProjects = computed(() => {
  let filtered = projectsBillingStatus.value

  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.project.name.toLowerCase().includes(query)
      || p.project.client?.name.toLowerCase().includes(query)
    )
  }

  // Filtre par statut
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter((p) => {
      switch (statusFilter.value) {
        case 'no_quote':
          return p.quoteStatus === 'none'
        case 'has_quote':
          return p.quoteStatus === 'available'
        case 'no_invoice':
          return p.invoiceStatus === 'none'
        case 'has_invoice':
          return p.invoiceStatus === 'available'
        default:
          return true
      }
    })
  }

  return filtered
})

const getQuoteStatusColor = (status: string): 'neutral' | 'primary' | 'success' | 'error' | 'warning' => {
  const colors: Record<string, 'neutral' | 'primary' | 'success' | 'error' | 'warning'> = {
    none: 'neutral',
    available: 'success'
  }
  return colors[status] || 'neutral'
}

const getQuoteStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    none: 'Aucun devis',
    available: 'Document disponible'
  }
  return labels[status] || status
}

const getInvoiceStatusColor = (status: string): 'neutral' | 'primary' | 'success' | 'warning' | 'error' => {
  const colors: Record<string, 'neutral' | 'primary' | 'success' | 'warning' | 'error'> = {
    none: 'neutral',
    available: 'success'
  }
  return colors[status] || 'neutral'
}

const getInvoiceStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    none: 'Aucune facture',
    available: 'Document disponible'
  }
  return labels[status] || status
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

// Navigation vers les détails
const navigateToClient = (clientId: number) => {
  navigateTo(`/clients/${clientId}`)
}

const navigateToProject = (clientId: number, projectId: number) => {
  navigateTo(`/clients/${clientId}/projects/${projectId}`)
}

// Stats globales
const stats = computed(() => {
  const totalProjects = projects.value.length
  const projectsWithQuotes = projectsBillingStatus.value.filter(p => p.quoteStatus !== 'none').length
  const projectsWithInvoices = projectsBillingStatus.value.filter(p => p.invoiceStatus !== 'none').length
  const totalQuoteDocuments = billingDocuments.value.filter(document => document.documentType === 'quote').length
  const totalInvoiceDocuments = billingDocuments.value.filter(document => document.documentType === 'invoice').length

  return {
    totalProjects,
    projectsWithQuotes,
    projectsWithInvoices,
    totalQuoteDocuments,
    totalInvoiceDocuments
  }
})
</script>

<template>
  <div class="container mx-auto p-6 overflow-scroll">
    <!-- En-tête -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2 flex items-center gap-2">
        <UIcon name="i-lucide-receipt" />
        Tableau de bord Facturation
      </h1>
      <p class="text-gray-600">
        Suivez l'état de facturation de tous vos projets
      </p>
    </div>

    <!-- Stats globales -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <UCard variant="soft">
        <div class="text-center">
          <p class="text-sm text-gray-600 mb-1">
            Projets totaux
          </p>
          <p class="text-3xl font-bold">
            {{ stats.totalProjects }}
          </p>
        </div>
      </UCard>

      <UCard variant="soft">
        <div class="text-center">
          <p class="text-sm text-gray-600 mb-1">
            Avec devis
          </p>
          <p class="text-3xl font-bold text-primary-600">
            {{ stats.projectsWithQuotes }}
          </p>
        </div>
      </UCard>

      <UCard variant="soft">
        <div class="text-center">
          <p class="text-sm text-gray-600 mb-1">
            Avec facture
          </p>
          <p class="text-3xl font-bold text-success-600">
            {{ stats.projectsWithInvoices }}
          </p>
        </div>
      </UCard>

      <UCard variant="soft">
        <div class="text-center">
          <p class="text-sm text-gray-600 mb-1">
            Devis téléversés
          </p>
          <p class="text-2xl font-bold text-primary-600">
            {{ stats.totalQuoteDocuments }}
          </p>
        </div>
      </UCard>

      <UCard variant="soft">
        <div class="text-center">
          <p class="text-sm text-gray-600 mb-1">
            Factures téléversées
          </p>
          <p class="text-2xl font-bold text-success-600">
            {{ stats.totalInvoiceDocuments }}
          </p>
        </div>
      </UCard>
    </div>

    <!-- Filtres -->
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
          :variant="statusFilter === 'no_quote' ? 'solid' : 'soft'"
          color="neutral"
          @click="statusFilter = 'no_quote'"
        >
          Sans devis
        </UButton>
        <UButton
          :variant="statusFilter === 'has_quote' ? 'solid' : 'soft'"
          color="success"
          @click="statusFilter = 'has_quote'"
        >
          Avec devis
        </UButton>
        <UButton
          :variant="statusFilter === 'no_invoice' ? 'solid' : 'soft'"
          color="neutral"
          @click="statusFilter = 'no_invoice'"
        >
          Sans facture
        </UButton>
        <UButton
          :variant="statusFilter === 'has_invoice' ? 'solid' : 'soft'"
          color="success"
          @click="statusFilter = 'has_invoice'"
        >
          Avec facture
        </UButton>
      </div>
    </div>

    <!-- Tableau des projets -->
    <div
      v-if="filteredProjects.length > 0"
      class="space-y-4"
    >
      <UCard
        v-for="item in filteredProjects"
        :key="item.project.id"
        variant="soft"
        class="hover:bg-elevated transition-all duration-200"
      >
        <div class="space-y-4">
          <!-- En-tête du projet -->
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="text-xl font-bold">
                  {{ item.project.name }}
                </h3>
                <UBadge
                  variant="soft"
                  :color="getProjectStatusColor(item.project.status)"
                >
                  {{ item.project.status.replace('_', ' ') }}
                </UBadge>
              </div>
              <button
                v-if="item.project.client"
                class="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1"
                @click="navigateToClient(item.project.clientId)"
              >
                <UIcon name="i-lucide-building-2" />
                {{ item.project.client.name }}
              </button>
            </div>
          </div>

          <!-- Pipeline de facturation -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Devis -->
            <div class="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold flex items-center gap-2">
                  <UIcon name="i-lucide-file-text" />
                  Devis
                </h4>
                <UBadge
                  variant="soft"
                  size="xs"
                >
                  {{ item.quotesCount }}
                </UBadge>
              </div>
              <UBadge
                variant="soft"
                :color="getQuoteStatusColor(item.quoteStatus)"
                class="w-full justify-center py-2"
              >
                {{ getQuoteStatusLabel(item.quoteStatus) }}
              </UBadge>
            </div>

            <!-- Factures -->
            <div class="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold flex items-center gap-2">
                  <UIcon name="i-lucide-file-minus" />
                  Factures
                </h4>
                <UBadge
                  variant="soft"
                  size="xs"
                >
                  {{ item.invoicesCount }}
                </UBadge>
              </div>
              <UBadge
                variant="soft"
                :color="getInvoiceStatusColor(item.invoiceStatus)"
                class="w-full justify-center py-2"
              >
                {{ getInvoiceStatusLabel(item.invoiceStatus) }}
              </UBadge>
            </div>

            <!-- État global -->
            <div class="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold flex items-center gap-2">
                  <UIcon name="i-lucide-folders" />
                  Résumé
                </h4>
              </div>
              <div class="space-y-2">
                <div>
                  <p class="text-xs text-gray-600">
                    Documents de facturation
                  </p>
                  <p class="text-lg font-bold text-primary-600">
                    {{ item.quotesCount + item.invoicesCount }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-600">
                    Couverture
                  </p>
                  <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {{ item.quoteStatus !== 'none' ? 'Devis présent' : 'Pas de devis' }} ·
                    {{ item.invoiceStatus !== 'none' ? 'Facture présente' : 'Pas de facture' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
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

    <!-- Message si aucun projet -->
    <div
      v-else
      class="text-center py-12"
    >
      <UIcon
        name="i-lucide-inbox"
        class="text-6xl text-gray-400 mb-4"
      />
      <p class="text-xl text-gray-600 mb-2">
        Aucun projet trouvé
      </p>
      <p class="text-gray-500">
        {{ searchQuery || statusFilter !== 'all' ? 'Essayez de modifier vos filtres' : 'Créez votre premier projet depuis la page clients' }}
      </p>
    </div>
  </div>
</template>
