<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Contact } from '~/types'

const props = defineProps<{
  contacts: Contact[]
  showArchived: boolean
}>()

const emit = defineEmits<{
  create: []
  edit: [contactId: number]
  delete: [contactId: number]
  archive: [contactId: number]
  restore: [contactId: number]
  createClient: [contactId: number]
  toggleArchived: []
}>()

const getContactFullName = (contact: Contact) => `${contact.firstName} ${contact.lastName}`

const columns: TableColumn<Contact>[] = [
  {
    accessorKey: 'fullName',
    header: 'Contact',
    meta: {
      class: {
        th: 'w-[12%]',
        td: 'truncate'
      }
    }
  },
  {
    accessorKey: 'client',
    header: 'Client',
    meta: {
      class: {
        th: 'w-[16%]',
        td: 'truncate'
      }
    }
  },
  {
    accessorKey: 'email',
    header: 'Email',
    meta: {
      class: {
        th: 'w-[20%]',
        td: 'truncate'
      }
    }
  },
  {
    id: 'phone',
    header: 'Téléphone',
    meta: {
      class: {
        th: 'w-[18%]',
        td: 'truncate'
      }
    }
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    meta: {
      class: {
        th: 'w-[20%]',
        td: 'whitespace-normal'
      }
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    meta: {
      class: {
        th: 'w-[14%] text-right',
        td: 'text-right'
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

      <div class="flex items-center gap-2">
        <UButton
          :icon="showArchived ? 'i-lucide-users' : 'i-lucide-archive'"
          variant="ghost"
          color="neutral"
          @click="emit('toggleArchived')"
        >
          {{ showArchived ? 'Voir les contacts actifs' : 'Voir les contacts archivés' }}
        </UButton>
        <UButton
          icon="i-lucide-circle-plus"
          color="neutral"
          variant="soft"
          @click="emit('create')"
        >
          Nouveau contact
        </UButton>
      </div>
    </div>

    <div class="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <UTable
        :data="props.contacts"
        :columns="columns"
        sticky="header"
        :ui="{ base: 'table-fixed w-full' }"
        class="max-h-[calc(100vh-14rem)]"
      >
        <template #fullName-cell="{ row }">
          <div>
            <p class="truncate font-semibold text-slate-900">
              {{ getContactFullName(row.original) }}
            </p>
            <p class="mt-1 text-xs text-slate-500">
              {{ row.original.position || '—' }}
            </p>
          </div>
        </template>

        <template #client-cell="{ row }">
          <div class="flex items-center gap-2">
            <NuxtLink
              v-if="row.original.client"
              :to="`/clients/${row.original.client.id}`"
              class="inline-flex max-w-full items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100"
            >
              <UIcon
                name="i-lucide-building-2"
                class="shrink-0"
              />
              <span class="truncate">{{ row.original.client.name }}</span>
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
          <AppLink
            v-if="row.original.email"
            :to="`mailto:${row.original.email}`"
            variant="tertiary"
            aria-label="Envoyer un e-mail"
          >
            {{ row.original.email }}
          </AppLink>
          <span v-else>—</span>
        </template>

        <template #phone-cell="{ row }">
          <div v-if="row.original.phone || row.original.mobile">
            <p
              v-if="row.original.phone"
            >
              {{ row.original.phone }}
            </p>
            <p
              v-if="row.original.mobile"
            >
              {{ row.original.mobile }}
            </p>
          </div>
          <span v-else>—</span>
        </template>

        <template #notes-cell="{ row }">
          <p
            v-if="row.original.notes"
            class="line-clamp-2"
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
              v-if="!row.original.archived"
              icon="i-lucide-archive"
              size="sm"
              color="error"
              variant="ghost"
              aria-label="Archiver le contact"
              @click="emit('archive', row.original.id)"
            />
            <template v-else>
              <UButton
                icon="i-lucide-archive-restore"
                size="sm"
                color="neutral"
                variant="ghost"
                aria-label="Restaurer le contact"
                @click="emit('restore', row.original.id)"
              />
              <UButton
                icon="i-lucide-trash-2"
                size="sm"
                color="error"
                variant="ghost"
                aria-label="Supprimer le contact"
                @click="emit('delete', row.original.id)"
              />
            </template>
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
