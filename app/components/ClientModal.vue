<script setup lang="ts">
import type { Client } from '~/validation/clients'
import { clientCreateSchema, clientUpdateSchema } from '~/validation/clients'

const props = defineProps<{
  open: boolean
  clientId?: number | null
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
const isEditing = computed(() => props.clientId != null)

const schema = computed(() => (isEditing.value ? clientUpdateSchema : clientCreateSchema))
const modalTitle = computed(() => (isEditing.value ? 'Modifier le client' : 'Nouveau client'))
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : 'Créer le client'))

const formState = reactive({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  website: '',
  notes: '',
  icon: '',
  description: ''
})

const resetForm = () => {
  Object.assign(formState, {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    website: '',
    notes: '',
    icon: '',
    description: ''
  })
}

const fillFromClient = (client: Client) => {
  Object.assign(formState, {
    name: client.name ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    address: client.address ?? '',
    city: client.city ?? '',
    postalCode: client.postalCode ?? '',
    country: client.country ?? '',
    website: client.website ?? '',
    notes: client.notes ?? '',
    icon: client.icon ?? '',
    description: client.description ?? ''
  })
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    if (isEditing.value && props.client) fillFromClient(props.client)
    else resetForm()
  },
  { immediate: true }
)

watch(
  () => props.client,
  (client) => {
    if (!props.open) return
    if (isEditing.value && client) fillFromClient(client)
  }
)

const onSubmit = async () => {
  isSaving.value = true
  try {
    const body = {
      name: formState.name,
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
            {{ submitLabel }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
