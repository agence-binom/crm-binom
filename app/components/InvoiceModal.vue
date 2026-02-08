<script setup lang="ts">
import { invoiceCreateSchema, invoiceUpdateSchema } from '~/validation/invoices'

interface Invoice {
  id: number
  clientId: number
  projectId?: number | null
  quoteId?: number | null
  number: string
  status: string
  totalHT: string
  totalTTC: string
  vatRate: string
  paidAmount: string
  issueDate: string | Date
  dueDate: string | Date
  paidDate?: string | Date | null
  notes?: string | null
  terms?: string | null
}

const props = defineProps<{
  open: boolean
  invoiceId?: number | null
  invoice?: Invoice | null
  clientId?: number
  projectId?: number
  quoteId?: number
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
const isEditing = computed(() => props.invoiceId != null)

const schema = computed(() => (isEditing.value ? invoiceUpdateSchema : invoiceCreateSchema))
const modalTitle = computed(() => (isEditing.value ? 'Modifier la facture' : 'Nouvelle facture'))
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : 'Créer la facture'))

const formState = reactive<{
  clientId: number
  projectId?: number
  quoteId?: number
  number: string
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  totalHT: string
  totalTTC: string
  vatRate: string
  paidAmount: string
  issueDate: string
  dueDate: string
  paidDate: string
  notes: string
  terms: string
}>({
  clientId: props.clientId || 0,
  projectId: props.projectId || undefined,
  quoteId: props.quoteId || undefined,
  number: '',
  status: 'draft',
  totalHT: '0',
  totalTTC: '0',
  vatRate: '20',
  paidAmount: '0',
  issueDate: toDateString(),
  dueDate: toDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  paidDate: '',
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
    quoteId: props.quoteId || undefined,
    number: '',
    status: 'draft',
    totalHT: '0',
    totalTTC: '0',
    vatRate: '20',
    paidAmount: '0',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paidDate: '',
    notes: '',
    terms: ''
  })
}

const fillFromInvoice = (invoice: Invoice) => {
  Object.assign(formState, {
    clientId: invoice.clientId,
    projectId: invoice.projectId || undefined,
    quoteId: invoice.quoteId || undefined,
    number: invoice.number,
    status: invoice.status,
    totalHT: invoice.totalHT,
    totalTTC: invoice.totalTTC,
    vatRate: invoice.vatRate,
    paidAmount: invoice.paidAmount,
    issueDate: toDateString(new Date(invoice.issueDate)),
    dueDate: toDateString(new Date(invoice.dueDate)),
    paidDate: invoice.paidDate ? toDateString(new Date(invoice.paidDate)) : '',
    notes: invoice.notes || '',
    terms: invoice.terms || ''
  })
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    if (isEditing.value && props.invoice) fillFromInvoice(props.invoice)
    else resetForm()
  },
  { immediate: true }
)

watch(
  () => props.invoice,
  (invoice) => {
    if (!props.open) return
    if (isEditing.value && invoice) fillFromInvoice(invoice)
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
      paidAmount: formState.paidAmount,
      issueDate: new Date(formState.issueDate),
      dueDate: new Date(formState.dueDate),
      notes: formState.notes,
      terms: formState.terms
    }

    if (formState.projectId) body.projectId = formState.projectId
    if (formState.quoteId) body.quoteId = formState.quoteId
    if (formState.paidDate) body.paidDate = new Date(formState.paidDate)

    if (isEditing.value) {
      if (!props.invoiceId) throw new Error('invoiceId manquant pour la mise à jour')
      await $fetch(`/api/invoices/${props.invoiceId}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/invoices', { method: 'POST', body })
    }

    emit('saved')
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la facture:', error)
  } finally {
    isSaving.value = false
  }
}

const statusOptions = [
  { label: 'Brouillon', value: 'draft' },
  { label: 'Envoyée', value: 'sent' },
  { label: 'Payée', value: 'paid' },
  { label: 'Paiement partiel', value: 'partial' },
  { label: 'En retard', value: 'overdue' },
  { label: 'Annulée', value: 'cancelled' }
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
            label="Numéro de facture"
            name="number"
            required
            class="flex-1"
          >
            <UInput
              v-model="formState.number"
              placeholder="Ex: FAC-2026-001"
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

        <UFormField
          label="Montant déjà payé (€)"
          name="paidAmount"
        >
          <UInput
            v-model="formState.paidAmount"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </UFormField>

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
            label="Date d'échéance"
            name="dueDate"
            required
            class="flex-1"
          >
            <UInput
              v-model="formState.dueDate"
              type="date"
            />
          </UFormField>

          <UFormField
            label="Date de paiement"
            name="paidDate"
            class="flex-1"
          >
            <UInput
              v-model="formState.paidDate"
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
            placeholder="Notes internes sur cette facture..."
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
