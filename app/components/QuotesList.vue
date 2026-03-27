<script setup lang="ts">
interface Quote {
  id: number
  clientId: number
  projectId?: number | null
  number: string
  status: string
  totalHT: string
  totalTTC: string
  issueDate: string | Date
  validUntil?: string | Date | null
}

const _props = defineProps<{
  quotes: Quote[]
  showHeader?: boolean
  showCreateButton?: boolean
  showDeleteButton?: boolean
  emptyMessage?: string
}>()

const emit = defineEmits<{
  create: []
  edit: [quoteId: number]
  delete: [quoteId: number]
}>()

const getStatusColor = (status: string): 'neutral' | 'primary' | 'success' | 'error' | 'warning' => {
  const colors: Record<string, 'neutral' | 'primary' | 'success' | 'error' | 'warning'> = {
    draft: 'neutral',
    sent: 'primary',
    accepted: 'success',
    rejected: 'error',
    expired: 'warning'
  }
  return colors[status] || 'neutral'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyé',
    accepted: 'Accepté',
    rejected: 'Refusé',
    expired: 'Expiré'
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
</script>

<template>
  <div>
    <div
      v-if="showHeader"
      class="flex justify-between items-center mb-6"
    >
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <UIcon name="i-lucide-file-text" />
        Devis
        <UBadge
          color="neutral"
          variant="soft"
        >
          {{ quotes.length }}
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
        Nouveau devis
      </UButton>
    </div>

    <div
      v-if="quotes.length > 0"
      class="space-y-4"
    >
      <UCard
        v-for="quote in quotes"
        :key="quote.id"
        variant="soft"
        role="button"
        tabindex="0"
        :aria-label="`Modifier le devis ${quote.number}`"
        class="hover:bg-elevated transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="emit('edit', quote.id)"
        @keydown.enter.prevent="emit('edit', quote.id)"
        @keydown.space.prevent="emit('edit', quote.id)"
      >
        <div class="flex justify-between items-start gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-lg font-semibold">
                {{ quote.number }}
              </h3>
              <UBadge
                variant="soft"
                class="rounded-full px-3"
                :color="getStatusColor(quote.status)"
              >
                {{ getStatusLabel(quote.status) }}
              </UBadge>
            </div>
            <div class="text-sm text-gray-600 space-y-1">
              <p>Date d'émission: {{ formatDate(quote.issueDate) }}</p>
              <p v-if="quote.validUntil">
                Valide jusqu'au: {{ formatDate(quote.validUntil) }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">
              HT
            </p>
            <p class="text-2xl font-bold">
              {{ formatAmount(quote.totalHT) }}
            </p>
            <p class="text-sm text-gray-600">
              TTC: {{ formatAmount(quote.totalTTC) }}
            </p>
          </div>
          <UButton
            v-if="showDeleteButton"
            size="sm"
            variant="soft"
            color="error"
            icon="i-lucide-trash"
            @click.stop="emit('delete', quote.id)"
          />
        </div>
      </UCard>
    </div>

    <div
      v-else
      class="text-center py-8"
    >
      <UIcon
        name="i-lucide-file-text"
        class="text-4xl text-gray-400 mb-2"
      />
      <p class="text-gray-600">
        {{ emptyMessage || 'Aucun devis' }}
      </p>
    </div>
  </div>
</template>
