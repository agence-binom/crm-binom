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
    <div class="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
      <h2 class="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900">
        <UIcon name="i-lucide-users" />
        Contacts
        <UBadge
          color="neutral"
          variant="soft"
          class="rounded-full"
        >
          {{ filteredContacts.length }}
        </UBadge>
      </h2>
      <div class="flex items-center gap-2">
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
      </div>
    </div>

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

    <div
      v-else
      class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 px-6 py-10 text-center"
    >
      <UIcon
        name="i-lucide-user-x"
        class="mb-3 text-4xl text-slate-300"
      />
      <p class="mb-4 text-slate-600">
        {{ showArchived ? 'Aucun contact archivé' : 'Aucun contact pour ce client' }}
      </p>
      <UButton
        v-if="!showArchived"
        icon="i-lucide-circle-plus"
        variant="soft"
        color="neutral"
        @click="emit('create')"
      >
        Créer le premier contact
      </UButton>
    </div>
  </div>
</template>
