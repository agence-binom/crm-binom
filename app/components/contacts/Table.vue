<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Contact } from '~/types'

defineProps<{
  contacts: Contact[]
}>()

const emit = defineEmits<{
  create: []
  edit: [contactId: number]
  delete: [contactId: number]
  createClient: [contactId: number]
}>()

const getContactFullName = (contact: Contact) => `${contact.firstName} ${contact.lastName}`

const columns: TableColumn<Contact>[] = [
  {
    accessorKey: 'fullName',
    header: 'Contact'
  },
  {
    accessorKey: 'position',
    header: 'Poste'
  },
  {
    accessorKey: 'client',
    header: 'Client'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'phone',
    header: 'Téléphone'
  },
  {
    accessorKey: 'mobile',
    header: 'Mobile'
  },
  {
    accessorKey: 'notes',
    header: 'Notes'
  },
  {
    id: 'actions',
    header: 'Actions',
    meta: {
      class: {
        th: 'text-right',
        td: 'w-px'
      }
    }
  }
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-semibold tracking-tight text-slate-900">
          Contacts
        </h1>
        <UBadge
          color="neutral"
          variant="soft"
          class="rounded-full"
        >
          {{ contacts.length }}
        </UBadge>
      </div>

      <UButton
        icon="i-lucide-circle-plus"
        color="neutral"
        variant="soft"
        @click="emit('create')"
      >
        Nouveau contact
      </UButton>
    </div>

    <div class="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <UTable
        :data="contacts"
        :columns="columns"
        sticky="header"
        class="max-h-[calc(100vh-14rem)]"
      >
        <template #fullName-cell="{ row }">
          <div class="min-w-32">
            <p class="font-semibold text-slate-900">
              {{ getContactFullName(row.original) }}
            </p>
            <p class="mt-1 text-xs text-slate-500">
              #{{ row.original.id }}
            </p>
          </div>
        </template>

        <template #position-cell="{ row }">
          {{ row.original.position || '—' }}
        </template>

        <template #client-cell="{ row }">
          <div class="flex items-center gap-2">
            <NuxtLink
              v-if="row.original.client"
              :to="`/clients/${row.original.client.id}`"
              class="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100"
            >
              <UIcon name="i-lucide-building-2" />
              {{ row.original.client.name }}
            </NuxtLink>
            <template v-else>
              <UBadge
                variant="soft"
                color="neutral"
                class="rounded-full"
              >
                Non associé
              </UBadge>
              <UButton
                icon="i-lucide-plus"
                size="xs"
                color="neutral"
                variant="soft"
                aria-label="Créer un client depuis ce contact"
                @click="emit('createClient', row.original.id)"
              />
            </template>
          </div>
        </template>

        <template #email-cell="{ row }">
          {{ row.original.email || '—' }}
        </template>

        <template #phone-cell="{ row }">
          {{ row.original.phone || '—' }}
        </template>

        <template #mobile-cell="{ row }">
          {{ row.original.mobile || '—' }}
        </template>

        <template #notes-cell="{ row }">
          <p
            v-if="row.original.notes"
            class="max-w-64 line-clamp-2"
          >
            {{ row.original.notes }}
          </p>
          <span v-else>—</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-2">
            <UButton
              icon="i-lucide-pencil"
              size="sm"
              color="neutral"
              variant="ghost"
              aria-label="Modifier le contact"
              @click="emit('edit', row.original.id)"
            />
            <UButton
              icon="i-lucide-trash-2"
              size="sm"
              color="error"
              variant="ghost"
              aria-label="Supprimer le contact"
              @click="emit('delete', row.original.id)"
            />
          </div>
        </template>

        <template #empty>
          <div class="flex flex-col items-center justify-center gap-3 px-6 text-center">
            <UIcon
              name="i-lucide-user-round-search"
              class="text-4xl text-slate-300"
            />
            <div class="space-y-1">
              <p class="font-medium text-slate-700">
                Aucun contact
              </p>
              <UButton
                icon="i-lucide-circle-plus"
                color="neutral"
                variant="soft"
                @click="emit('create')"
              >
                Créer un premier contact
              </UButton>
            </div>
          </div>
        </template>
      </UTable>
    </div>
  </div>
</template>
