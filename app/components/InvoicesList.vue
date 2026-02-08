<script setup lang="ts">
interface Invoice {
  id: number
  clientId: number
  projectId?: number | null
  quoteId?: number | null
  number: string
  status: string
  totalHT: string
  totalTTC: string
  paidAmount: string
  issueDate: string | Date
  dueDate: string | Date
  paidDate?: string | Date | null
}

const _props = defineProps<{
  invoices: Invoice[]
  showHeader?: boolean
  showCreateButton?: boolean
  showDeleteButton?: boolean
  emptyMessage?: string
}>()

const emit = defineEmits<{
  create: []
  edit: [invoiceId: number]
  delete: [invoiceId: number]
  addPayment: [invoiceId: number]
}>()

const getStatusColor = (status: string): 'neutral' | 'primary' | 'success' | 'warning' | 'error' => {
  const colors: Record<string, 'neutral' | 'primary' | 'success' | 'warning' | 'error'> = {
    draft: 'neutral',
    sent: 'primary',
    paid: 'success',
    partial: 'warning',
    overdue: 'error',
    cancelled: 'neutral'
  }
  return colors[status] || 'neutral'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    partial: 'Paiement partiel',
    overdue: 'En retard',
    cancelled: 'Annulée'
  }
  return labels[status] || status
}

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR')
}

const formatAmount = (amount: string | number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(Number(amount))
}

const getRemainingAmount = (invoice: Invoice) => {
  return Number(invoice.totalTTC) - Number(invoice.paidAmount)
}

const isOverdue = (invoice: Invoice) => {
  if (invoice.status === 'paid') return false
  const dueDate = new Date(invoice.dueDate)
  return dueDate < new Date()
}
</script>

<template>
  <div>
    <div
      v-if="showHeader"
      class="flex justify-between items-center mb-6"
    >
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <UIcon name="i-lucide-file-minus" />
        Factures
        <UBadge
          color="neutral"
          variant="soft"
        >
          {{ invoices.length }}
        </UBadge>
      </h2>
      <UButton
        v-if="showCreateButton"
        icon="i-lucide-circle-plus"
        size="md"
        variant="outline"
        color="neutral"
        @click="emit('create')"
      >
        Nouvelle facture
      </UButton>
    </div>

    <div
      v-if="invoices.length > 0"
      class="space-y-4"
    >
      <UCard
        v-for="invoice in invoices"
        :key="invoice.id"
        variant="soft"
        :class="[
          'hover:bg-elevated transition-all duration-200 cursor-pointer',
          isOverdue(invoice) && 'border-l-4 border-red-500'
        ]"
        @click="emit('edit', invoice.id)"
      >
        <div class="flex justify-between items-start gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-lg font-semibold">
                {{ invoice.number }}
              </h3>
              <UBadge
                variant="soft"
                class="rounded-full px-3"
                :color="getStatusColor(invoice.status)"
              >
                {{ getStatusLabel(invoice.status) }}
              </UBadge>
              <UBadge
                v-if="isOverdue(invoice)"
                variant="soft"
                color="error"
                class="rounded-full px-3"
              >
                En retard
              </UBadge>
            </div>
            <div class="text-sm text-gray-600 space-y-1">
              <p>Date d'émission: {{ formatDate(invoice.issueDate) }}</p>
              <p>Date d'échéance: {{ formatDate(invoice.dueDate) }}</p>
              <p v-if="invoice.paidDate">
                Payée le: {{ formatDate(invoice.paidDate) }}
              </p>
              <p v-if="Number(invoice.paidAmount) > 0 && invoice.status !== 'paid'">
                Payé: {{ formatAmount(invoice.paidAmount) }} / Reste: {{ formatAmount(getRemainingAmount(invoice)) }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">
              HT
            </p>
            <p class="text-2xl font-bold">
              {{ formatAmount(invoice.totalHT) }}
            </p>
            <p class="text-sm text-gray-600">
              TTC: {{ formatAmount(invoice.totalTTC) }}
            </p>
          </div>
          <div class="flex flex-col gap-2">
            <UButton
              v-if="invoice.status !== 'paid' && invoice.status !== 'cancelled'"
              size="sm"
              variant="soft"
              color="primary"
              icon="i-lucide-banknote"
              @click.stop="emit('addPayment', invoice.id)"
            >
              Paiement
            </UButton>
            <UButton
              v-if="showDeleteButton"
              size="sm"
              variant="soft"
              color="error"
              icon="i-lucide-trash"
              @click.stop="emit('delete', invoice.id)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <div
      v-else
      class="text-center py-8"
    >
      <UIcon
        name="i-lucide-file-minus"
        class="text-4xl text-gray-400 mb-2"
      />
      <p class="text-gray-600">
        {{ emptyMessage || 'Aucune facture' }}
      </p>
    </div>
  </div>
</template>
