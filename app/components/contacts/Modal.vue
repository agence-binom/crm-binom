<script setup lang="ts">
import { contactCreateSchema, contactUpdateSchema } from '~/validation/contacts'
import type { Client, Contact } from '~/types'

type ContactModalClientOption = Pick<Client, 'id' | 'name'>

const props = defineProps<{
  open: boolean
  contactId?: number | null
  contact?: Contact | null
  clientId?: number | null
  clients?: ContactModalClientOption[]
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
const isEditing = computed(() => props.contactId != null)

const schema = computed(() => (isEditing.value ? contactUpdateSchema : contactCreateSchema))
const modalTitle = computed(() => (isEditing.value ? 'Modifier le contact' : 'Nouveau contact'))
const submitLabel = computed(() => (isEditing.value ? 'Enregistrer' : 'Créer le contact'))

const formState = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  mobile: '',
  position: '',
  notes: '',
  clientId: props.clientId ?? null as number | null
})

const selectedClient = computed({
  get: () => clientOptions.value.find(client => client.value === formState.clientId),
  set: (value) => { formState.clientId = value?.value ?? null }
})

const { data: clientsData, refresh: refreshClients } = await useFetch('/api/clients', {
  immediate: false
})
const clientOptions = computed(() => {
  const clients = props.clients ?? clientsData.value?.clients ?? []

  return [
    { label: 'Aucun client', value: null as number | null },
    ...clients.map((client: ContactModalClientOption) => ({
      label: client.name,
      value: client.id
    }))
  ]
})

const resetForm = () => {
  Object.assign(formState, {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    position: '',
    notes: '',
    clientId: props.clientId ?? null
  })
}

const fillFromContact = (contact: Contact) => {
  Object.assign(formState, {
    firstName: contact.firstName ?? '',
    lastName: contact.lastName ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    mobile: contact.mobile ?? '',
    position: contact.position ?? '',
    notes: contact.notes ?? '',
    clientId: contact.clientId ?? props.clientId ?? null
  })
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    if (props.clients === undefined && !clientsData.value) {
      await refreshClients()
    }
    if (isEditing.value && props.contact) fillFromContact(props.contact)
    else resetForm()
  },
  { immediate: true }
)

watch(
  () => props.contact,
  (contact) => {
    if (!props.open) return
    if (isEditing.value && contact) fillFromContact(contact)
  }
)

const onSubmit = async () => {
  isSaving.value = true
  try {
    const body = {
      firstName: formState.firstName,
      lastName: formState.lastName,
      email: formState.email,
      phone: formState.phone,
      mobile: formState.mobile,
      position: formState.position,
      notes: formState.notes,
      clientId: formState.clientId
    }

    if (isEditing.value) {
      if (!props.contactId) throw new Error('contactId manquant pour la mise à jour')
      await $fetch(`/api/contacts/${props.contactId}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/contacts', { method: 'POST', body })
    }

    emit('saved')
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du contact:', error)
    showError(
      'Enregistrement impossible',
      error,
      'Impossible de sauvegarder le contact.'
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
    :aria-describedby="isEditing ? 'Modifier les informations du contact' : 'Créer un nouveau contact'"
    :close="{
      color: 'error',
      variant: 'solid',
      icon: 'i-lucide-x',
      size: 'xs',
      label: 'Fermer'
    }"
    class="w-full max-w-3xl rounded-2xl"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="formState"
        class="space-y-5"
        @submit="onSubmit"
      >
        <div class="space-y-6">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Prénom"
              name="firstName"
              required
            >
              <UInput
                v-model="formState.firstName"
                placeholder="Jean"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Nom"
              name="lastName"
              required
            >
              <UInput
                v-model="formState.lastName"
                placeholder="Dupont"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Email"
              name="email"
            >
              <UInput
                v-model="formState.email"
                type="email"
                placeholder="jean.dupont@example.com"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Poste"
              name="position"
            >
              <UInput
                v-model="formState.position"
                placeholder="Directeur commercial"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Téléphone"
              name="phone"
            >
              <UInput
                v-model="formState.phone"
                type="tel"
                placeholder="01 23 45 67 89"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Mobile"
              name="mobile"
            >
              <UInput
                v-model="formState.mobile"
                type="tel"
                placeholder="06 12 34 56 78"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            label="Client"
            name="clientId"
          >
            <USelectMenu
              v-model="selectedClient"
              :items="clientOptions"
              placeholder="Associer à un client"
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
              placeholder="Contexte, informations utiles, preferences..."
              class="w-full"
            />
          </UFormField>

          <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <UButton
              variant="soft"
              color="neutral"
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
        </div>
      </UForm>
    </template>
  </UModal>
</template>
