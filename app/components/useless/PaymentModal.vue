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
    class="w-full max-w-2xl rounded-2xl"
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
        class="space-y-5"
        @submit="onSubmit"
      >
        <div class="space-y-6">
          <UBadge
            v-if="props.remainingAmount != null"
            variant="soft"
            color="success"
            class="rounded-full px-3 py-1"
          >
            Reste : {{ props.remainingAmount.toFixed(2) }} €
          </UBadge>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Montant (€)"
              name="amount"
              required
            >
              <UInput
                v-model="formState.amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Date de paiement"
              name="paymentDate"
              required
            >
              <UInput
                v-model="formState.paymentDate"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Méthode de paiement"
              name="paymentMethod"
              required
            >
              <USelect
                v-model="formState.paymentMethod"
                :options="paymentMethodOptions"
                option-label="label"
                option-value="value"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Type"
              name="type"
            >
              <USelect
                v-model="formState.type"
                :options="typeOptions"
                option-label="label"
                option-value="value"
                class="w-full"
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
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Notes"
            name="notes"
          >
            <UTextarea
              v-model="formState.notes"
              :rows="4"
              placeholder="Notes sur ce paiement..."
              class="w-full"
            />
          </UFormField>

          <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
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
        </div>
      </UForm>
    </template>
  </UModal>
</template>
