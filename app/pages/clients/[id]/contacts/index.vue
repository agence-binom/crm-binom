<script setup lang="ts">
const route = useRoute()
const clientId = computed(() => Number(route.params.id))

const { data, refresh } = await useFetch(`/api/clients/${clientId.value}/contacts`)
const client = computed(() => data.value?.client)
const contacts = computed(() => data.value?.contacts || [])

const onDeleteContact = async (contactId: number) => {
  if (!confirm('Voulez-vous vraiment supprimer ce contact ?')) return

  try {
    const { error } = await useFetch(`/api/contacts/${contactId}`, {
      method: 'DELETE'
    })

    if (error.value) {
      console.error('Erreur lors de la suppression du contact:', error.value)
      return
    }

    await refresh()
  } catch (err) {
    console.error('Erreur lors de la suppression du contact:', err)
  }
}
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="mb-6">
      <UButton
        to="/clients"
        variant="ghost"
        icon="i-lucide-arrow-left"
        label="Retour aux clients"
      />
    </div>

    <div
      v-if="!data"
      class="text-center py-12"
    >
      Chargement...
    </div>

    <template v-else>
      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-2">
          Contacts de {{ client?.name }}
        </h1>
        <p class="text-gray-600">
          {{ client?.email }}
        </p>
      </div>

      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold">
          {{ contacts.length }} contact{{ contacts.length > 1 ? 's' : '' }}
        </h2>
        <UButton :to="`/clients/${clientId}/contacts/new`">
          Nouveau contact
        </UButton>
      </div>

      <div
        v-if="contacts.length === 0"
        class="text-center py-12 bg-white rounded-lg shadow"
      >
        <p class="text-gray-500 mb-4">
          Aucun contact pour ce client
        </p>
        <UButton :to="`/clients/${clientId}/contacts/new`">
          Créer un contact
        </UButton>
      </div>

      <ul
        v-else
        class="divide-y divide-gray-200 bg-white rounded-lg shadow"
      >
        <li
          v-for="contact in contacts"
          :key="contact.id"
          class="p-4 hover:bg-gray-50"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-medium text-gray-900">
                {{ contact.firstName }} {{ contact.lastName }}
              </h3>
              <div class="mt-1 text-sm text-gray-500">
                <p v-if="contact.email">
                  📧 {{ contact.email }}
                </p>
                <p v-if="contact.phone">
                  📞 {{ contact.phone }}
                </p>
                <p
                  v-if="contact.position"
                  class="text-gray-400"
                >
                  {{ contact.position }}
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <UButton
                size="sm"
                variant="ghost"
                color="error"
                icon="i-lucide-trash"
                @click="onDeleteContact(contact.id)"
              />
            </div>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>
