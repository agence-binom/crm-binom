<script setup lang="ts">
const { data: projectsData } = await useFetch('/api/projects')
const { data: quotesData } = await useFetch('/api/quotes')
const { data: invoicesData } = await useFetch('/api/invoices')
const { data: clientsData } = await useFetch('/api/clients')

const projects = computed(() => projectsData.value?.projects || [])
const quotes = computed(() => quotesData.value?.quotes || [])
const invoices = computed(() => invoicesData.value?.invoices || [])
const clients = computed(() => clientsData.value?.clients || [])

// Enrichir les projets avec les infos client
const projectsWithClients = computed(() => {
  return projects.value.map(project => ({
    ...project,
    client: clients.value.find(c => c.id === project.clientId)
  }))
})

// Calculer l'état de facturation pour chaque projet
const projectsBillingStatus = computed(() => {
  return projectsWithClients.value.map((project) => {
    const projectQuotes = quotes.value.filter(q => q.projectId === project.id)
    const projectInvoices = invoices.value.filter(i => i.projectId === project.id)

    // Dernier devis
    const lastQuote = projectQuotes.length > 0
      ? projectQuotes.reduce((latest, q) => q.id > latest.id ? q : latest)
      : null

    // Statut global du devis
    const quoteStatus = !lastQuote ? 'none' : lastQuote.status

    // Calcul des montants facturés
    const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + Number(inv.totalTTC), 0)
    const totalPaid = projectInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0)

    // Statut global de facturation
    let invoiceStatus = 'none'
    if (projectInvoices.length > 0) {
      const allPaid = projectInvoices.every(inv => inv.status === 'paid')
      const somePaid = projectInvoices.some(inv => inv.status === 'paid')
      const somePartial = projectInvoices.some(inv => inv.status === 'partial')

      if (allPaid) invoiceStatus = 'paid'
      else if (somePaid || somePartial) invoiceStatus = 'partial'
      else if (projectInvoices.some(inv => inv.status === 'sent')) invoiceStatus = 'sent'
      else invoiceStatus = 'draft'
    }

    return {
      project,
      lastQuote,
      quoteStatus,
      quotesCount: projectQuotes.length,
      invoicesCount: projectInvoices.length,
      invoiceStatus,
      totalInvoiced,
      totalPaid,
      projectInvoices
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
        case 'quote_draft':
          return p.quoteStatus === 'draft'
        case 'quote_sent':
          return p.quoteStatus === 'sent'
        case 'quote_accepted':
          return p.quoteStatus === 'accepted'
        case 'no_invoice':
          return p.invoiceStatus === 'none'
        case 'invoice_sent':
          return p.invoiceStatus === 'sent'
        case 'invoice_partial':
          return p.invoiceStatus === 'partial'
        case 'invoice_paid':
          return p.invoiceStatus === 'paid'
        default:
          return true
      }
    })
  }

  return filtered
})

const formatAmount = (amount: string | number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(Number(amount))
}

const getQuoteStatusColor = (status: string): 'neutral' | 'primary' | 'success' | 'error' | 'warning' => {
  const colors: Record<string, 'neutral' | 'primary' | 'success' | 'error' | 'warning'> = {
    none: 'neutral',
    draft: 'neutral',
    sent: 'primary',
    accepted: 'success',
    rejected: 'error',
    expired: 'warning'
  }
  return colors[status] || 'neutral'
}

const getQuoteStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    none: 'Aucun devis',
    draft: 'Brouillon',
    sent: 'Envoyé',
    accepted: 'Accepté',
    rejected: 'Refusé',
    expired: 'Expiré'
  }
  return labels[status] || status
}

const getInvoiceStatusColor = (status: string): 'neutral' | 'primary' | 'success' | 'warning' | 'error' => {
  const colors: Record<string, 'neutral' | 'primary' | 'success' | 'warning' | 'error'> = {
    none: 'neutral',
    draft: 'neutral',
    sent: 'primary',
    partial: 'warning',
    paid: 'success',
    overdue: 'error'
  }
  return colors[status] || 'neutral'
}

const getInvoiceStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    none: 'Aucune facture',
    draft: 'Brouillon',
    sent: 'Envoyée',
    partial: 'Paiement partiel',
    paid: 'Payée',
    overdue: 'En retard'
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
  const totalRevenue = projectsBillingStatus.value.reduce((sum, p) => sum + p.totalPaid, 0)
  const totalPending = projectsBillingStatus.value.reduce((sum, p) => sum + (p.totalInvoiced - p.totalPaid), 0)

  return {
    totalProjects,
    projectsWithQuotes,
    projectsWithInvoices,
    totalRevenue,
    totalPending
  }
})
</script>

<template>
  <div class="container mx-auto p-6">
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
            Facturés
          </p>
          <p class="text-3xl font-bold text-success-600">
            {{ stats.projectsWithInvoices }}
          </p>
        </div>
      </UCard>

      <UCard variant="soft">
        <div class="text-center">
          <p class="text-sm text-gray-600 mb-1">
            Encaissé
          </p>
          <p class="text-2xl font-bold text-success-600">
            {{ formatAmount(stats.totalRevenue) }}
          </p>
        </div>
      </UCard>

      <UCard variant="soft">
        <div class="text-center">
          <p class="text-sm text-gray-600 mb-1">
            En attente
          </p>
          <p class="text-2xl font-bold text-warning-600">
            {{ formatAmount(stats.totalPending) }}
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
          :variant="statusFilter === 'quote_sent' ? 'solid' : 'soft'"
          color="primary"
          @click="statusFilter = 'quote_sent'"
        >
          Devis envoyé
        </UButton>
        <UButton
          :variant="statusFilter === 'quote_accepted' ? 'solid' : 'soft'"
          color="success"
          @click="statusFilter = 'quote_accepted'"
        >
          Devis accepté
        </UButton>
        <UButton
          :variant="statusFilter === 'no_invoice' ? 'solid' : 'soft'"
          color="neutral"
          @click="statusFilter = 'no_invoice'"
        >
          Sans facture
        </UButton>
        <UButton
          :variant="statusFilter === 'invoice_sent' ? 'solid' : 'soft'"
          color="primary"
          @click="statusFilter = 'invoice_sent'"
        >
          Facture envoyée
        </UButton>
        <UButton
          :variant="statusFilter === 'invoice_partial' ? 'solid' : 'soft'"
          color="warning"
          @click="statusFilter = 'invoice_partial'"
        >
          Paiement partiel
        </UButton>
        <UButton
          :variant="statusFilter === 'invoice_paid' ? 'solid' : 'soft'"
          color="success"
          @click="statusFilter = 'invoice_paid'"
        >
          Payée
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
              <div
                v-if="item.lastQuote"
                class="mt-2 text-sm text-gray-600"
              >
                <p class="font-semibold">
                  {{ formatAmount(item.lastQuote.totalTTC) }}
                </p>
                <p class="text-xs">
                  {{ item.lastQuote.number }}
                </p>
              </div>
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
              <div
                v-if="item.invoicesCount > 0"
                class="mt-2 text-sm text-gray-600"
              >
                <p class="font-semibold">
                  {{ formatAmount(item.totalInvoiced) }}
                </p>
                <p class="text-xs">
                  Total facturé
                </p>
              </div>
            </div>

            <!-- Paiements -->
            <div class="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold flex items-center gap-2">
                  <UIcon name="i-lucide-banknote" />
                  Paiements
                </h4>
              </div>
              <div class="space-y-2">
                <div>
                  <p class="text-xs text-gray-600">
                    Encaissé
                  </p>
                  <p class="text-lg font-bold text-success-600">
                    {{ formatAmount(item.totalPaid) }}
                  </p>
                </div>
                <div v-if="item.totalInvoiced > item.totalPaid">
                  <p class="text-xs text-gray-600">
                    Reste à payer
                  </p>
                  <p class="text-lg font-bold text-warning-600">
                    {{ formatAmount(item.totalInvoiced - item.totalPaid) }}
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
