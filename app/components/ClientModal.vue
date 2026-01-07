<script setup lang="ts">
import type { Client } from '~/validation/clients'
import { clientUpdateSchema } from '~/validation/clients'

const props = defineProps<{
  open: boolean
  client?: Client | null
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saved': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isSaving = ref(false)
console.log('Client', props.client)

const formState = reactive({
  email: props.client?.email || '',
  phone: props.client?.phone || '',
  address: props.client?.address || '',
  city: props.client?.city || '',
  postalCode: props.client?.postalCode || '',
  country: props.client?.country || '',
  website: props.client?.website || '',
  notes: props.client?.notes || '',
  icon: props.client?.icon || '',
  description: props.client?.description || ''
})

const onSubmit = async () => {
  isSaving.value = true
  try {
    const body = {
      email: formState.email,
      phone: formState.phone,
      address: formState.address,
      city: formState.city,
      postalCode: formState.postalCode,
      country: formState.country,
      website: formState.website,
      notes: formState.notes,
      icon: formState.icon,
      description: formState.description
    }

    await $fetch(`/api/clients/${props.client?.id}`, { method: 'PUT', body })

    emit('saved')
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la tâche:', error)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Informations du client"
    aria-describedby="Modifier les informations du client"
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
        :schema="clientUpdateSchema"
        :state="formState"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Icône"
          name="icon"
        >
          <UInput
            v-model="formState.icon"
          />
        </UFormField>

        <UFormField
          label="Description"
          name="description"
        >
          <UTextarea
            v-model="formState.description"
            :rows="2"
            class="w-full"
          />
        </UFormField>

        <div class="flex w-full gap-4">
          <UFormField
            label="Email"
            name="email"
            class="flex-1"
          >
            <UInput
              v-model="formState.email"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Téléphone"
            name="phone"
            class="flex-1"
          >
            <UInput
              v-model="formState.phone"
              type="tel"
              class="w-full"
            />
          </UFormField>
        </div>
        <UFormField
          label="Addresse"
          name="address"
        >
          <UInput
            v-model="formState.address"
            type="text"
            class="w-full"
          />
        </UFormField>

        <div class="flex w-full gap-4">
          <UFormField
            label="Code Postal"
            name="postalCode"
            class="flex-1"
          >
            <UInput
              v-model="formState.postalCode"
              type="text"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Ville"
            name="city"
            class="flex-1"
          >
            <UInput
              v-model="formState.city"
              type="text"
              class="w-full"
            />
          </UFormField>
        </div>
        <UFormField
          label="Pays"
          name="country"
        >
          <UInput
            v-model="formState.country"
            type="text"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Site Web"
          name="website"
        >
          <UInput
            v-model="formState.website"
            type="url"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Notes"
          name="notes"
        >
          <UTextarea
            v-model="formState.notes"
            :rows="5"
            class="w-full"
          />
        </UFormField>

        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isSaving"
            @click="isOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            type="submit"
            :loading="isSaving"
          >
            Valider
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
