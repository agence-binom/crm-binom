<script setup lang="ts">
import { contactCreateSchema, contactUpdateSchema } from '~/validation/contacts'
import type { Contact } from '~/types'

const props = defineProps<{
  open: boolean
  contactId?: number | null
  contact?: Contact | null
  clientId: number
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
  clientId: props.clientId
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
    clientId: props.clientId
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
    clientId: props.clientId
  })
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
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
    class="w-full max-w-3xl"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="formState"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="flex gap-4">
          <UFormField
            label="Prénom"
            name="firstName"
            class="flex-1"
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
            class="flex-1"
            required
          >
            <UInput
              v-model="formState.lastName"
              placeholder="Dupont"
              class="w-full"
            />
          </UFormField>
        </div>
        <div class="flex gap-4">
          <UFormField
            label="Email"
            name="email"
            class="flex-1"
          >
            <UInput
              v-model="formState.email"
              type="email"
              placeholder="jean.dupont@example.com"
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
              placeholder="01 23 45 67 89"
              class="w-full"
            />
          </UFormField>
        </div>
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

        <UFormField
          label="Notes"
          name="notes"
        >
          <UTextarea
            v-model="formState.notes"
            :rows="3"
            placeholder="Notes supplémentaires..."
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            variant="soft"
            color="neutral"
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
