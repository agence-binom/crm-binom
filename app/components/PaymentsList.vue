<script setup lang="ts">
interface Payment {
  id: number
  invoiceId: number
  amount: string
  paymentDate: string | Date
  paymentMethod: string
  type: string
  reference?: string | null
  notes?: string | null
  createdAt: string | Date
}

const props = defineProps<{
  payments: Payment[]
  showHeader?: boolean
  emptyMessage?: string
}>()

const emit = defineEmits<{
  delete: [paymentId: number]
}>()

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatAmount = (amount: string | number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(Number(amount))
}

const getMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    bank_transfer: 'Virement bancaire',
    check: 'Chèque',
    cash: 'Espèces',
    credit_card: 'Carte de crédit',
    other: 'Autre'
  }
  return labels[method] || method
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    payment: 'Paiement',
    deposit: 'Acompte',
    refund: 'Remboursement'
  }
  return labels[type] || type
}

const getTypeColor = (type: string): 'neutral' | 'primary' | 'success' | 'warning' => {
  const colors: Record<string, 'neutral' | 'primary' | 'success' | 'warning'> = {
    payment: 'success',
    deposit: 'primary',
    refund: 'warning'
  }
  return colors[type] || 'neutral'
}

const totalPaid = computed(() => {
  return props.payments.reduce((sum, payment) => {
    const amount = Number(payment.amount)
    return payment.type === 'refund' ? sum - amount : sum + amount
  }, 0)
})
</script>

<template>
  <div>
    <div
      v-if="showHeader"
      class="flex justify-between items-center mb-6"
    >
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <UIcon name="i-lucide-banknote" />
        Paiements
        <UBadge
          color="neutral"
          variant="soft"
        >
          {{ payments.length }}
        </UBadge>
      </h2>
      <div
        v-if="payments.length > 0"
        class="text-right"
      >
        <p class="text-sm text-gray-600">
          Total payé
        </p>
        <p class="text-2xl font-bold text-success-600">
          {{ formatAmount(totalPaid) }}
        </p>
      </div>
    </div>

    <div
      v-if="payments.length > 0"
      class="space-y-3"
    >
      <UCard
        v-for="payment in payments"
        :key="payment.id"
        variant="soft"
        class="hover:bg-elevated transition-all duration-200"
      >
        <div class="flex justify-between items-start gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <UBadge
                variant="soft"
                class="rounded-full px-3"
                :color="getTypeColor(payment.type)"
              >
                {{ getTypeLabel(payment.type) }}
              </UBadge>
              <span class="text-sm text-gray-600">
                {{ getMethodLabel(payment.paymentMethod) }}
              </span>
            </div>
            <div class="text-sm text-gray-600 space-y-1">
              <p>Date: {{ formatDate(payment.paymentDate) }}</p>
              <p v-if="payment.reference">
                Référence: {{ payment.reference }}
              </p>
              <p
                v-if="payment.notes"
                class="text-gray-500 italic"
              >
                {{ payment.notes }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p
                class="text-2xl font-bold"
                :class="payment.type === 'refund' ? 'text-warning-600' : 'text-success-600'"
              >
                {{ payment.type === 'refund' ? '-' : '+' }}{{ formatAmount(payment.amount) }}
              </p>
            </div>
            <UButton
              size="sm"
              variant="soft"
              color="error"
              icon="i-lucide-trash"
              @click="emit('delete', payment.id)"
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
        name="i-lucide-banknote"
        class="text-4xl text-gray-400 mb-2"
      />
      <p class="text-gray-600">
        {{ emptyMessage || 'Aucun paiement enregistré' }}
      </p>
    </div>
  </div>
</template>
