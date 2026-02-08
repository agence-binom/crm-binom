<script setup lang="ts">
const route = useRoute()
const clientId = computed(() => Number(route.params.id))
const projectId = computed(() => Number(route.params.projectId))

const { data, refresh } = await useFetch(`/api/projects/${projectId.value}`)
const project = computed(() => data.value)

const { data: tasksData, refresh: refreshTasks } = await useFetch(`/api/projects/${projectId.value}/tasks`)
const projectTasks = computed(() => tasksData.value?.tasks || [])

// Données de facturation
const { data: quotesData, refresh: refreshQuotes } = await useFetch(`/api/projects/${projectId.value}/quotes`)
const quotes = computed(() => quotesData.value?.quotes || [])

const { data: invoicesData, refresh: refreshInvoices } = await useFetch(`/api/projects/${projectId.value}/invoices`)
const invoices = computed(() => invoicesData.value?.invoices || [])

const { selectedUser, userOptions, filteredTasks } = useUserFilter(projectTasks)

const isProjectModalOpen = ref(false)
const isQuoteModalOpen = ref(false)
const isInvoiceModalOpen = ref(false)
const isPaymentModalOpen = ref(false)
const selectedQuoteId = ref<number | null>(null)
const selectedInvoiceId = ref<number | null>(null)
const selectedInvoiceForPayment = ref<number | null>(null)

const { deleteResource } = useDeleteConfirmation()

const onDeleteProject = async (projectId: number) => {
  await deleteResource('projet', projectId, '/api/projects', async () => {
    await navigateTo(`/clients/${clientId.value}`)
  })
}

const handleProjectChange = async () => {
  await refresh()
}

// Handlers pour les devis
const openCreateQuote = () => {
  selectedQuoteId.value = null
  isQuoteModalOpen.value = true
}

const openEditQuote = (quoteId: number) => {
  selectedQuoteId.value = quoteId
  isQuoteModalOpen.value = true
}

const handleQuoteChange = async () => {
  await refreshQuotes()
}

const onDeleteQuote = async (quoteId: number) => {
  await deleteResource('devis', quoteId, '/api/quotes', refreshQuotes)
}

const quoteToEdit = computed(() => {
  if (!selectedQuoteId.value) return null
  return quotes.value.find(q => q.id === selectedQuoteId.value) ?? null
})

// Handlers pour les factures
const openCreateInvoice = () => {
  selectedInvoiceId.value = null
  isInvoiceModalOpen.value = true
}

const openEditInvoice = (invoiceId: number) => {
  selectedInvoiceId.value = invoiceId
  isInvoiceModalOpen.value = true
}

const handleInvoiceChange = async () => {
  await refreshInvoices()
}

const onDeleteInvoice = async (invoiceId: number) => {
  await deleteResource('facture', invoiceId, '/api/invoices', refreshInvoices)
}

const invoiceToEdit = computed(() => {
  if (!selectedInvoiceId.value) return null
  return invoices.value.find(i => i.id === selectedInvoiceId.value) ?? null
})

// Handlers pour les paiements
const openPaymentModal = (invoiceId: number) => {
  selectedInvoiceForPayment.value = invoiceId
  isPaymentModalOpen.value = true
}

const handlePaymentChange = async () => {
  await refreshInvoices()
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

    <!-- Modals de facturation -->
    <QuoteModal
      v-model:open="isQuoteModalOpen"
      :quote-id="selectedQuoteId"
      :quote="quoteToEdit"
      :client-id="project.clientId"
      :project-id="project.id"
      @saved="handleQuoteChange"
    />

    <InvoiceModal
      v-model:open="isInvoiceModalOpen"
      :invoice-id="selectedInvoiceId"
      :invoice="invoiceToEdit"
      :client-id="project.clientId"
      :project-id="project.id"
      @saved="handleInvoiceChange"
    />

    <PaymentModal
      v-model:open="isPaymentModalOpen"
      :invoice-id="selectedInvoiceForPayment"
      @saved="handlePaymentChange"
    />

    <!-- Facturation -->
    <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <QuotesList
          :quotes="quotes"
          :show-header="true"
          :show-create-button="true"
          @create="openCreateQuote"
          @edit="openEditQuote"
          @delete="onDeleteQuote"
        />
      </div>

      <div>
        <InvoicesList
          :invoices="invoices"
          :show-header="true"
          :show-create-button="true"
          @create="openCreateInvoice"
          @edit="openEditInvoice"
          @delete="onDeleteInvoice"
          @add-payment="openPaymentModal"
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
