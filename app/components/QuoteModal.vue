<script setup lang="ts">
import { quoteCreateSchema, quoteUpdateSchema } from '~/validation/quotes'

interface Quote {
  id: number
  clientId: number
  projectId?: number | null
  number: string
  status: string
  totalHT: string
  totalTTC: string
  vatRate: string
  issueDate: string | Date
  validUntil?: string | Date | null
  notes?: string | null
  terms?: string | null
}

const props = defineProps<{
  open: boolean
  quoteId?: number | null
  quote?: Quote | null
  clientId?: number
  projectId?: number
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saved': []
}>()

const toDateString = (date: Date = new Date()): string => {
  return date.toISOString().substring(0, 10)
}
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isSaving = ref(false)
const isEditing = computed(() => props.quoteId != null)

const schema = computed(() => (isEditing.value ? quoteUpdateSchema : quoteCreateSchema))
const modalTitle = computed(() => (isEditing.value ? 'Modifier le devis' : 'Nouveau devis'))
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : 'Créer le devis'))

const formState = reactive<{
  clientId: number
  projectId?: number
  number: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  totalHT: string
  totalTTC: string
  vatRate: string
  issueDate: string
  validUntil: string
  notes: string
  terms: string
}>({
  clientId: props.clientId || 0,
  projectId: props.projectId || undefined,
  number: '',
  status: 'draft',
  totalHT: '0',
  totalTTC: '0',
  vatRate: '20',
  issueDate: toDateString(),
  validUntil: '',
  notes: '',
  terms: ''
})

const calculateTTC = () => {
  const ht = parseFloat(formState.totalHT) || 0
  const vat = parseFloat(formState.vatRate) || 0
  formState.totalTTC = (ht * (1 + vat / 100)).toFixed(2)
}

watch([() => formState.totalHT, () => formState.vatRate], calculateTTC)

const resetForm = () => {
  Object.assign(formState, {
    clientId: props.clientId || 0,
    projectId: props.projectId || undefined,
    number: '',
    status: 'draft',
    totalHT: '0',
    totalTTC: '0',
    vatRate: '20',
    issueDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    notes: '',
    terms: ''
  })
}

const fillFromQuote = (quote: Quote) => {
  Object.assign(formState, {
    clientId: quote.clientId,
    projectId: quote.projectId || undefined,
    number: quote.number,
    status: quote.status,
    totalHT: quote.totalHT,
    totalTTC: quote.totalTTC,
    vatRate: quote.vatRate,
    issueDate: toDateString(new Date(quote.issueDate)),
    validUntil: quote.validUntil ? toDateString(new Date(quote.validUntil)) : '',
    notes: quote.notes || '',
    terms: quote.terms || ''
  })
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    if (isEditing.value && props.quote) fillFromQuote(props.quote)
    else resetForm()
  },
  { immediate: true }
)

watch(
  () => props.quote,
  (quote) => {
    if (!props.open) return
    if (isEditing.value && quote) fillFromQuote(quote)
  }
)

const onSubmit = async () => {
  isSaving.value = true
  try {
    const body: Record<string, unknown> = {
      clientId: formState.clientId,
      number: formState.number,
      status: formState.status,
      totalHT: formState.totalHT,
      totalTTC: formState.totalTTC,
      vatRate: formState.vatRate,
      issueDate: new Date(formState.issueDate),
      notes: formState.notes,
      terms: formState.terms
    }

    if (formState.projectId) body.projectId = formState.projectId
    if (formState.validUntil) body.validUntil = new Date(formState.validUntil)

    if (isEditing.value) {
      if (!props.quoteId) throw new Error('quoteId manquant pour la mise à jour')
      await $fetch(`/api/quotes/${props.quoteId}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/quotes', { method: 'POST', body })
    }

    emit('saved')
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du devis:', error)
  } finally {
    isSaving.value = false
  }
}

const statusOptions = [
  { label: 'Brouillon', value: 'draft' },
  { label: 'Envoyé', value: 'sent' },
  { label: 'Accepté', value: 'accepted' },
  { label: 'Refusé', value: 'rejected' },
  { label: 'Expiré', value: 'expired' }
]
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    class="w-full max-w-3xl"
    :close="{
      color: 'error',
      variant: 'solid',
      icon: 'i-lucide-x',
      size: 'xs',
      label: 'Fermer'
    }"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="formState"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="flex w-full gap-4">
          <UFormField
            label="Numéro de devis"
            name="number"
            required
            class="flex-1"
          >
            <UInput
              v-model="formState.number"
              placeholder="Ex: DEV-2026-001"
            />
          </UFormField>

          <UFormField
            label="Statut"
            name="status"
            class="flex-1"
          >
            <USelect
              v-model="formState.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
            />
          </UFormField>
        </div>

        <div class="flex w-full gap-4">
          <UFormField
            label="Montant HT (€)"
            name="totalHT"
            required
            class="flex-1"
          >
            <UInput
              v-model="formState.totalHT"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </UFormField>

          <UFormField
            label="TVA (%)"
            name="vatRate"
            class="flex-1"
          >
            <UInput
              v-model="formState.vatRate"
              type="number"
              step="0.01"
              placeholder="20"
            />
          </UFormField>

          <UFormField
            label="Montant TTC (€)"
            name="totalTTC"
            class="flex-1"
          >
            <UInput
              v-model="formState.totalTTC"
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled
            />
          </UFormField>
        </div>

        <div class="flex w-full gap-4">
          <UFormField
            label="Date d'émission"
            name="issueDate"
            required
            class="flex-1"
          >
            <UInput
              v-model="formState.issueDate"
              type="date"
            />
          </UFormField>

          <UFormField
            label="Valide jusqu'au"
            name="validUntil"
            class="flex-1"
          >
            <UInput
              v-model="formState.validUntil"
              type="date"
            />
          </UFormField>
        </div>

        <UFormField
          label="Notes"
          name="notes"
        >
          <UTextarea
            v-model="formState.notes"
            :rows="3"
            placeholder="Notes internes sur ce devis..."
          />
        </UFormField>

        <UFormField
          label="Conditions générales"
          name="terms"
        >
          <UTextarea
            v-model="formState.terms"
            :rows="3"
            placeholder="Conditions générales de vente..."
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="soft"
            :disabled="isSaving"
            @click="isOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            type="submit"
            :loading="isSaving"
          >
            {{ submitLabel }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
