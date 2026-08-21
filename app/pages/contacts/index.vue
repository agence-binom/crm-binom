<script setup lang="ts">
import type { Client, Contact } from '~/types'

const { data, refresh } = await useFetch('/api/contacts/dashboard')
const allContacts = computed<Contact[]>(() => data.value?.contacts || [])
const clientOptions = computed<Array<Pick<Client, 'id' | 'name'>>>(() => data.value?.clientOptions || [])

const showArchived = ref(false)
const contacts = computed<Contact[]>(() => allContacts.value.filter(contact => Boolean(contact.archived) === showArchived.value))
const toggleArchived = () => {
  showArchived.value = !showArchived.value
}

const isContactModalOpen = ref(false)
const isClientModalOpen = ref(false)
const selectedContactId = ref<number | null>(null)
const sourceContactIdForClient = ref<number | null>(null)

const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()
const { setArchived } = useArchiveAction()
const { showError } = useFeedbackToast()

const contactToEdit = computed(() => {
  if (!selectedContactId.value) {
    return null
  }

  return contacts.value.find(contact => contact.id === selectedContactId.value) ?? null
})

const sourceContactForClient = computed(() => {
  if (!sourceContactIdForClient.value) {
    return null
  }

  return contacts.value.find(contact => contact.id === sourceContactIdForClient.value) ?? null
})

const clientInitialValues = computed<Partial<Client> | null>(() => {
  if (!sourceContactForClient.value) {
    return null
  }

  return {
    email: sourceContactForClient.value.email ?? '',
    phone: sourceContactForClient.value.phone ?? sourceContactForClient.value.mobile ?? '',
    notes: sourceContactForClient.value.notes ?? ''
  }
})

const openCreateContact = () => {
  selectedContactId.value = null
  isContactModalOpen.value = true
}

const openEditContact = (contactId: number) => {
  selectedContactId.value = contactId
  isContactModalOpen.value = true
}

const openCreateClientFromContact = (contactId: number) => {
  sourceContactIdForClient.value = contactId
  isClientModalOpen.value = true
}

const handleContactSaved = async () => {
  await refresh()
}

const handleClientSaved = async (client?: Client) => {
  if (!client || !sourceContactIdForClient.value) {
    await refresh()
    return
  }

  try {
    await $fetch(`/api/contacts/${sourceContactIdForClient.value}`, {
      method: 'PUT',
      body: { clientId: client.id }
    })
    await refresh()
  } catch (error) {
    console.error('Erreur lors de l’association du contact au client:', error)
    showError(
      'Association impossible',
      error,
      'Le client a bien été créé, mais le contact n’a pas pu être associé automatiquement.'
    )
  } finally {
    sourceContactIdForClient.value = null
  }
}

const handleClientModalClosed = (open: boolean) => {
  isClientModalOpen.value = open

  if (!open) {
    sourceContactIdForClient.value = null
  }
}

const onDeleteContact = async (contactId: number) => {
  await deleteResource('contact', contactId, '/api/contacts', refresh)
}

const onArchiveContact = async (contactId: number) => {
  await setArchived('contact', contactId, '/api/contacts', true, refresh)
}

const onRestoreContact = async (contactId: number) => {
  await setArchived('contact', contactId, '/api/contacts', false, refresh)
}
</script>

<template>
  <div class="container mx-auto p-6">
    <ContactsTable
      :contacts="contacts"
      :show-archived="showArchived"
      @create="openCreateContact"
      @edit="openEditContact"
      @delete="onDeleteContact"
      @archive="onArchiveContact"
      @restore="onRestoreContact"
      @toggle-archived="toggleArchived"
      @create-client="openCreateClientFromContact"
    />

    <ContactsModal
      v-model:open="isContactModalOpen"
      :contact-id="selectedContactId"
      :contact="contactToEdit"
      :clients="clientOptions"
      @saved="handleContactSaved"
    />

    <ClientsModal
      :open="isClientModalOpen"
      :initial-values="clientInitialValues"
      @update:open="handleClientModalClosed"
      @saved="handleClientSaved"
    />

    <ConfirmModal
      :open="confirmModalOpen"
      title="Confirmer la suppression"
      :message="confirmModalMessage"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </div>
</template>
