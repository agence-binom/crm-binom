<script setup lang="ts">
import { paymentCreateSchema } from '~/validation/payments'

const props = defineProps<{
  open: boolean
  invoiceId: number
  remainingAmount?: number
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saved': []
}>()
const { showError } = useFeedbackToast()

const toDateString = (date: Date = new Date()): string => {
  return date.toISOString().substring(0, 10)
}

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isSaving = ref(false)

const formState = reactive<{
  invoiceId: number
  amount: string
  paymentDate: string
  paymentMethod: 'bank_transfer' | 'check' | 'cash' | 'credit_card' | 'other'
  type: 'payment' | 'deposit' | 'refund'
  reference: string
  notes: string
}>({
  invoiceId: props.invoiceId,
  amount: props.remainingAmount?.toString() || '0',
  paymentDate: toDateString(),
  paymentMethod: 'bank_transfer',
  type: 'payment',
  reference: '',
  notes: ''
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    formState.invoiceId = props.invoiceId
    if (props.remainingAmount) {
      formState.amount = props.remainingAmount.toString()
    }
  }
)

const onSubmit = async () => {
  isSaving.value = true
  try {
    const body = {
      invoiceId: formState.invoiceId,
      amount: formState.amount,
      paymentDate: new Date(formState.paymentDate),
      paymentMethod: formState.paymentMethod,
      type: formState.type,
      reference: formState.reference,
      notes: formState.notes
    }

    await $fetch('/api/payments', { method: 'POST', body })

    emit('saved')
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du paiement:', error)
    showError(
      'Enregistrement impossible',
      error,
      'Impossible d\'enregistrer le paiement.'
    )
  } finally {
    isSaving.value = false
  }
}

const paymentMethodOptions = [
  { label: 'Virement bancaire', value: 'bank_transfer' },
  { label: 'Chèque', value: 'check' },
  { label: 'Espèces', value: 'cash' },
  { label: 'Carte de crédit', value: 'credit_card' },
  { label: 'Autre', value: 'other' }
]

const typeOptions = [
  { label: 'Paiement', value: 'payment' },
  { label: 'Acompte', value: 'deposit' },
  { label: 'Remboursement', value: 'refund' }
]
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Enregistrer un paiement"
    class="w-full max-w-2xl"
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
        :schema="paymentCreateSchema"
        :state="formState"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="flex w-full gap-4">
          <UFormField
            label="Montant (€)"
            name="amount"
            required
            class="flex-1"
          >
            <UInput
              v-model="formState.amount"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </UFormField>

          <UFormField
            label="Date de paiement"
            name="paymentDate"
            required
            class="flex-1"
          >
            <UInput
              v-model="formState.paymentDate"
              type="date"
            />
          </UFormField>
        </div>

        <div class="flex w-full gap-4">
          <UFormField
            label="Méthode de paiement"
            name="paymentMethod"
            required
            class="flex-1"
          >
            <USelect
              v-model="formState.paymentMethod"
              :options="paymentMethodOptions"
              option-label="label"
              option-value="value"
            />
          </UFormField>

          <UFormField
            label="Type"
            name="type"
            class="flex-1"
          >
            <USelect
              v-model="formState.type"
              :options="typeOptions"
              option-label="label"
              option-value="value"
            />
          </UFormField>
        </div>

        <UFormField
          label="Référence"
          name="reference"
        >
          <UInput
            v-model="formState.reference"
            placeholder="Numéro de transaction, de chèque..."
          />
        </UFormField>

        <UFormField
          label="Notes"
          name="notes"
        >
          <UTextarea
            v-model="formState.notes"
            :rows="3"
            placeholder="Notes sur ce paiement..."
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
            Enregistrer le paiement
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
