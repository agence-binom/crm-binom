<script setup lang="ts">
import type { Contact } from '~/validation/contacts'

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
  <div class="mb-4">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <UIcon name="i-lucide-users" />
        Contacts
        <UBadge
          color="neutral"
          variant="soft"
        >
          {{ contacts.length }}
        </UBadge>
      </h2>
      <UButton
        icon="i-lucide-circle-plus"
        size="md"
        variant="outline"
        color="neutral"
        @click="emit('create')"
      >
        Nouveau contact
      </UButton>
    </div>

    <ul
      v-if="contacts.length > 0"
      class="flex items-stretch gap-4 flex-wrap"
    >
      <li
        v-for="contact in contacts"
        :key="contact.id"
        class="min-w-sm"
      >
        <UCard
          variant="soft"
          class="h-full"
        >
          <div>
            <h3 class="text-xl font-semibold">
              {{ contact.firstName }} {{ contact.lastName }}
              <span class="text-sm text-gray-500">({{ contact.position }})</span>
            </h3>
            <div class="flex gap-2 mt-2">
              <UBadge
                v-if="contact.email"
                variant="soft"
                color="neutral"
                class="rounded-full"
                icon="i-lucide-mail"
              >
                {{ contact.email }}
              </UBadge>
              <UBadge
                v-if="contact.phone"
                variant="soft"
                color="neutral"
                class="rounded-full"
                icon="i-lucide-phone"
              >
                {{ contact.phone }}
              </UBadge>
              <UBadge
                v-if="contact.mobile"
                variant="soft"
                color="neutral"
                class="rounded-full"
                icon="i-lucide-smartphone"
              >
                {{ contact.mobile }}
              </UBadge>
            </div>
            <div
              v-if="contact.notes"
              class="mt-2"
            >
              {{ contact.notes }}
            </div>
            <div class="flex gap-2 mt-4">
              <UButton
                size="sm"
                variant="soft"
                icon="i-lucide-pencil"
                @click="emit('edit', contact.id)"
              />
              <UButton
                size="sm"
                variant="soft"
                color="error"
                icon="i-lucide-trash"
                @click="emit('delete', contact.id)"
              />
            </div>
          </div>
        </UCard>
      </li>
    </ul>

    <UCard v-else>
      <div class="text-center py-8">
        <UIcon
          name="i-lucide-user-x"
          class="text-4xl text-gray-400 mb-2"
        />
        <p class="text-gray-600 mb-4">
          Aucun contact pour ce client
        </p>
        <UButton
          icon="i-lucide-plus"
          @click="emit('create')"
        >
          Créer le premier contact
        </UButton>
      </div>
    </UCard>
  </div>
</template>
