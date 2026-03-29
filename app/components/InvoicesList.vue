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
  <div class="space-y-6">
    <div
      v-if="showHeader"
      class="flex items-center justify-between gap-4 border-b border-slate-100 pb-4"
    >
      <h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
        <UIcon name="i-lucide-file-minus" />
        Factures
        <UBadge
          color="neutral"
          variant="soft"
          class="rounded-full"
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
        <<<<<<<
        HEAD
        variant="soft"
        role="button"
        tabindex="0"
        :aria-label="`Modifier la facture ${invoice.number}`"
        =="====="
      >
        >>>>>> b10780cdbfcca77922fd8237f0a1499bfc68c5a0
        :class="[
        'group cursor-pointer rounded-[1.35rem] border-0 bg-white/90 shadow-sm ring-1 ring-gray-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        isOverdue(invoice) && 'ring-red-200/90'
        ]"
        @click="emit('edit', invoice.id)"
        @keydown.enter.prevent="emit('edit', invoice.id)"
        @keydown.space.prevent="emit('edit', invoice.id)"
        >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 space-y-2">
                <div class="flex flex-wrap items-center gap-2">
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

                <h3 class="text-lg font-semibold tracking-tight text-slate-900">
                  {{ invoice.number }}
                </h3>
              </div>

              <UButton
                v-if="showDeleteButton"
                size="sm"
                variant="soft"
                color="error"
                icon="i-lucide-trash"
                class="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                @click.stop="emit('delete', invoice.id)"
              />
            </div>

            <div class="flex flex-wrap gap-2 text-sm text-slate-500">
              <div class="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-inset ring-slate-200">
                <UIcon name="i-lucide-calendar" />
                {{ formatDate(invoice.issueDate) }}
              </div>
              <div class="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-inset ring-slate-200">
                <UIcon name="i-lucide-calendar-range" />
                {{ formatDate(invoice.dueDate) }}
              </div>
              <div
                v-if="invoice.paidDate"
                class="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-inset ring-slate-200"
              >
                <UIcon name="i-lucide-badge-check" />
                {{ formatDate(invoice.paidDate) }}
              </div>
              <div
                v-if="Number(invoice.paidAmount) > 0 && invoice.status !== 'paid'"
                class="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 ring-1 ring-inset ring-amber-200"
              >
                <UIcon name="i-lucide-banknote" />
                {{ formatAmount(invoice.paidAmount) }} / {{ formatAmount(getRemainingAmount(invoice)) }}
              </div>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="space-y-1 text-right">
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Total TTC
              </p>
              <p class="text-2xl font-semibold tracking-tight text-slate-900">
                {{ formatAmount(invoice.totalTTC) }}
              </p>
              <p class="text-sm text-slate-500">
                HT : {{ formatAmount(invoice.totalHT) }}
              </p>
            </div>

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
              aria-label="Supprimer la facture"
              @click.stop="emit('delete', invoice.id)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <div
      v-else
      class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 px-6 py-10 text-center"
    >
      <UIcon
        name="i-lucide-file-minus"
        class="mb-3 text-4xl text-slate-300"
      />
      <p class="text-slate-600">
        {{ emptyMessage || 'Aucune facture' }}
      </p>
    </div>
  </div>
</template>
