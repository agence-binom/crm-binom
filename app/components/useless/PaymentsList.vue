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
  <div class="space-y-6">
    <div
      v-if="showHeader"
      class="flex items-center justify-between gap-4 border-b border-slate-100 pb-4"
    >
      <h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
        <UIcon name="i-lucide-banknote" />
        Paiements
        <UBadge
          color="neutral"
          variant="soft"
          class="rounded-full"
        >
          {{ payments.length }}
        </UBadge>
      </h2>
      <div
        v-if="payments.length > 0"
        class="text-right"
      >
        <p class="text-sm text-slate-500">
          Total payé
        </p>
        <p class="text-2xl font-semibold tracking-tight text-emerald-600">
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
        class="group rounded-[1.35rem] border-0 bg-white/90 shadow-sm ring-1 ring-gray-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge
                    variant="soft"
                    class="rounded-full px-3"
                    :color="getTypeColor(payment.type)"
                  >
                    {{ getTypeLabel(payment.type) }}
                  </UBadge>
                  <UBadge
                    variant="soft"
                    color="neutral"
                    class="rounded-full px-3"
                  >
                    {{ getMethodLabel(payment.paymentMethod) }}
                  </UBadge>
                </div>

                <p class="text-sm text-slate-500">
                  {{ formatDate(payment.paymentDate) }}
                </p>
              </div>

              <UButton
                size="sm"
                variant="soft"
                color="error"
                icon="i-lucide-trash"
                class="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                @click="emit('delete', payment.id)"
              />
            </div>

            <div class="space-y-2 text-sm text-slate-500">
              <p v-if="payment.reference">
                Référence : {{ payment.reference }}
              </p>
              <p
                v-if="payment.notes"
                class="line-clamp-2 italic text-slate-500"
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
              aria-label="Supprimer le paiement"
              @click="emit('delete', payment.id)"
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
        name="i-lucide-banknote"
        class="mb-3 text-4xl text-slate-300"
      />
      <p class="text-slate-600">
        {{ emptyMessage || 'Aucun paiement enregistré' }}
      </p>
    </div>
  </div>
</template>
