<script setup lang="ts">
import type { Contact } from '~/types'

const _props = defineProps<{
  contacts: Contact[]
  clientId: number
}>()

const emit = defineEmits<{
  create: []
  edit: [contactId: number]
  delete: [contactId: number]
}>()
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
          {{ contacts.length }}
        </UBadge>
      </h2>
      <UButton
        icon="i-lucide-circle-plus"
        variant="soft"
        color="neutral"
        @click="emit('create')"
      >
        Nouveau contact
      </UButton>
    </div>

    <ul
      v-if="contacts.length > 0"
      class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <li
        v-for="contact in contacts"
        :key="contact.id"
      >
        <ContactsCard
          :contact="contact"
          @edit="emit('edit', contact.id)"
          @delete="emit('delete', contact.id)"
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
        Aucun contact pour ce client
      </p>
      <UButton
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
