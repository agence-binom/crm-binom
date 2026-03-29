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
      <h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
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
      class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <li
        v-for="contact in contacts"
        :key="contact.id"
      >
        <UCard
          class="group relative h-full rounded-[1.35rem] border-0 bg-white/90 shadow-sm ring-1 ring-gray-200/80"
        >
          <div class="space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 space-y-2">
                <h3 class="text-lg font-semibold tracking-tight text-slate-900">
                  {{ contact.firstName }} {{ contact.lastName }}
                </h3>

                <UBadge
                  v-if="contact.position"
                  variant="soft"
                  color="neutral"
                  class="rounded-full"
                >
                  {{ contact.position }}
                </UBadge>
              </div>

              <div class="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
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

            <div class="flex flex-wrap gap-2">
              <UBadge
                v-if="contact.email"
                variant="soft"
                color="neutral"
                class="max-w-full rounded-full"
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

            <p
              v-if="contact.notes"
              class="line-clamp-3 text-sm leading-6 text-slate-600"
            >
              {{ contact.notes }}
            </p>
          </div>
          <div class="flex gap-2 mt-4">
            <UButton
              size="sm"
              variant="soft"
              icon="i-lucide-pencil"
              aria-label="Modifier le contact"
              @click="emit('edit', contact.id)"
            />
            <UButton
              size="sm"
              variant="soft"
              color="error"
              icon="i-lucide-trash"
              aria-label="Supprimer le contact"
              @click="emit('delete', contact.id)"
            />
          </div>
        </Ucard>
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
        @click="emit('create')"
      >
        Créer le premier contact
      </UButton>
    </div>
  </div>
</template>
