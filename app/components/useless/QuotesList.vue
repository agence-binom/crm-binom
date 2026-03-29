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
  <div class="space-y-6">
    <div
      v-if="showHeader"
      class="flex items-center justify-between gap-4 border-b border-slate-100 pb-4"
    >
      <h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
        <UIcon name="i-lucide-file-text" />
        Devis
        <UBadge
          color="neutral"
          variant="soft"
          class="rounded-full"
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
        class="group cursor-pointer rounded-[1.35rem] border-0 bg-white/90 shadow-sm ring-1 ring-gray-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        @click="emit('edit', quote.id)"
        @keydown.enter.prevent="emit('edit', quote.id)"
        @keydown.space.prevent="emit('edit', quote.id)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge
                    variant="soft"
                    class="rounded-full px-3"
                    :color="getStatusColor(quote.status)"
                  >
                    {{ getStatusLabel(quote.status) }}
                  </UBadge>
                </div>

                <h3 class="text-lg font-semibold tracking-tight text-slate-900">
                  {{ quote.number }}
                </h3>
              </div>

              <UButton
                v-if="showDeleteButton"
                size="sm"
                variant="soft"
                color="error"
                icon="i-lucide-trash-2"
                class="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                @click.stop="emit('delete', quote.id)"
              />
            </div>

            <div class="flex flex-wrap gap-2 text-sm text-slate-500">
              <div class="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-inset ring-slate-200">
                <UIcon name="i-lucide-calendar" />
                {{ formatDate(quote.issueDate) }}
              </div>
              <div
                v-if="quote.validUntil"
                class="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-inset ring-slate-200"
              >
                <UIcon name="i-lucide-hourglass" />
                {{ formatDate(quote.validUntil) }}
              </div>
            </div>
          </div>

          <div class="space-y-1 text-right">
            <p class="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Total TTC
            </p>
            <p class="text-2xl font-semibold tracking-tight text-slate-900">
              {{ formatAmount(quote.totalTTC) }}
            </p>
            <p class="text-sm text-slate-500">
              HT : {{ formatAmount(quote.totalHT) }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <div
      v-else
      class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 px-6 py-10 text-center"
    >
      <UIcon
        name="i-lucide-file-text"
        class="mb-3 text-4xl text-slate-300"
      />
      <p class="text-slate-600">
        {{ emptyMessage || 'Aucun devis' }}
      </p>
    </div>
  </div>
</template>
