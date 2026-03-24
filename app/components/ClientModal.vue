<script setup lang="ts">
import {
  clientStatusOptions,
  defaultClientIcon,
  getClientIcon,
  normalizeClientStatus
} from '~/lib/clients'
import { clientIconOptions } from '~/lib/client-icons'
import { clientCreateSchema, clientUpdateSchema } from '~/validation/clients'
import type { Client } from '~/types'

const props = defineProps<{
  open: boolean
  clientId?: number | null
  client?: Client | null
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'saved': []
}>()
const { showError } = useFeedbackToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isSaving = ref(false)
const isEditing = computed(() => props.clientId != null)

const schema = computed(() => (isEditing.value ? clientUpdateSchema : clientCreateSchema))
const modalTitle = computed(() => (isEditing.value ? 'Modifier le client' : 'Nouveau client'))
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : 'Créer le client'))
const getOptionValue = (item: unknown) => {
  if (!item || typeof item !== 'object' || !('value' in item)) {
    return defaultClientIcon
  }

  return typeof item.value === 'string' ? item.value : defaultClientIcon
}
const createDefaultFormState = () => ({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  website: '',
  siret: '',
  notes: '',
  icon: defaultClientIcon,
  status: 'active' as const,
  description: ''
})
const createFormStateFromClient = (client?: Client | null) => ({
  ...createDefaultFormState(),
  name: client?.name ?? '',
  email: client?.email ?? '',
  phone: client?.phone ?? '',
  address: client?.address ?? '',
  city: client?.city ?? '',
  postalCode: client?.postalCode ?? '',
  country: client?.country ?? '',
  website: client?.website ?? '',
  siret: client?.siret ?? '',
  notes: client?.notes ?? '',
  icon: getClientIcon(client?.icon),
  status: normalizeClientStatus(client?.status),
  description: client?.description ?? ''
})
const formState = reactive(createDefaultFormState())

const applyFormState = (client?: Client | null) => Object.assign(formState, createFormStateFromClient(client))

watch(
  () => props.open,
  (open) => {
    if (!open) return
    applyFormState(isEditing.value ? props.client : null)
  },
  { immediate: true }
)

watch(
  () => props.client,
  (client) => {
    if (!props.open) return
    if (isEditing.value) applyFormState(client)
  }
)

const onSubmit = async () => {
  isSaving.value = true
  try {
    const body = { ...formState }

    if (isEditing.value) {
      if (!props.clientId) throw new Error('clientId manquant pour la mise à jour')
      await $fetch(`/api/clients/${props.clientId}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/clients', { method: 'POST', body })
    }

    emit('saved')
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du client:', error)
    showError(
      'Enregistrement impossible',
      error,
      'Impossible de sauvegarder le client.'
    )
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    :aria-describedby="isEditing ? 'Modifier les informations du client' : 'Créer un nouveau client'"
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
        <UFormField
          label="Nom de l'entreprise"
          name="name"
          required
        >
          <UInput
            v-model="formState.name"
            placeholder="Ex: Entreprise ABC"
          />
        </UFormField>

        <UFormField
          label="Icône client"
          name="icon"
        >
          <USelect
            v-model="formState.icon"
            :items="clientIconOptions"
            value-attribute="value"
            option-attribute="label"
            class="w-full"
          >
            <template #leading>
              <UIcon
                :name="formState.icon || defaultClientIcon"
                class="text-base text-dimmed"
              />
            </template>

            <template #item-leading="{ item }">
              <UIcon
                :name="getOptionValue(item)"
                class="text-base text-dimmed"
              />
            </template>
          </USelect>
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

        <div class="flex w-full gap-4">
          <UFormField
            label="SIRET"
            name="siret"
            class="flex-1"
          >
            <UInput
              v-model="formState.siret"
              type="text"
              placeholder="12345678901234"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Statut"
            name="status"
            class="flex-1"
          >
            <USelect
              v-model="formState.status"
              :items="clientStatusOptions"
              value-attribute="value"
              option-attribute="label"
            />
          </UFormField>
        </div>

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
