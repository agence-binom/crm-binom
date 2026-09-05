<script setup lang="ts">
import type { Contact } from '~/types'

const props = defineProps<{
  contacts: Contact[]
  clientId: number
}>()

const emit = defineEmits<{
  create: []
  edit: [contactId: number]
  delete: [contactId: number]
  archive: [contactId: number]
  restore: [contactId: number]
}>()

const showArchived = ref(false)
const filteredContacts = computed(() => props.contacts.filter(contact => Boolean(contact.archived) === showArchived.value))

const toggleArchived = () => {
  showArchived.value = !showArchived.value
}
</script>

<template>
  <div class="space-y-6">
    <AppListHeader
      title="Contacts"
      icon="i-lucide-users"
      :count="filteredContacts.length"
    >
      <template #actions>
        <UButton
          :icon="showArchived ? 'i-lucide-users' : 'i-lucide-archive'"
          variant="ghost"
          color="neutral"
          @click="toggleArchived"
        >
          {{ showArchived ? 'Voir les contacts actifs' : 'Voir les contacts archivés' }}
        </UButton>
        <UButton
          icon="i-lucide-circle-plus"
          variant="soft"
          color="neutral"
          @click="emit('create')"
        >
          Nouveau contact
        </UButton>
      </template>
    </AppListHeader>

    <ul
      v-if="filteredContacts.length > 0"
      class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <li
        v-for="contact in filteredContacts"
        :key="contact.id"
      >
        <ContactsCard
          :contact="contact"
          @edit="emit('edit', contact.id)"
          @delete="emit('delete', contact.id)"
          @archive="emit('archive', contact.id)"
          @restore="emit('restore', contact.id)"
        />
      </li>
    </ul>

    <AppEmptyState
      v-else
      icon="i-lucide-user-x"
      :title="showArchived ? 'Aucun contact archivé' : 'Aucun contact pour ce client'"
    >
      <template
        v-if="!showArchived"
        #actions
      >
        <UButton
          icon="i-lucide-circle-plus"
          variant="soft"
          color="neutral"
          @click="emit('create')"
        >
          Créer le premier contact
        </UButton>
      </template>
    </AppEmptyState>
  </div>
</template>
