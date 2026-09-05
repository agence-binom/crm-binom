<script setup lang="ts">
import { formatDate, getErrorMessage } from '~/lib/utils'

definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const error = ref<string | null>(null)

const { data } = await useFetch('/api/portal/session', {
  onResponseError: ({ response }) => {
    error.value = getErrorMessage(response._data, 'Impossible de charger votre espace client.')
  }
})

const client = computed(() => data.value?.client)
const contact = computed(() => data.value?.contact)

const onSignOut = async () => {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full text-center">
      <template v-if="client && contact">
        <h1 class="text-3xl font-bold mb-2">
          Bienvenue {{ contact.firstName }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mb-1">
          Espace client de <strong>{{ client.name }}</strong>
        </p>
        <p
          v-if="contact.portalLastLoginAt"
          class="text-sm text-gray-500 dark:text-gray-500"
        >
          Dernière connexion : {{ formatDate(contact.portalLastLoginAt) }}
        </p>
      </template>

      <UAlert
        v-else-if="error"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        title="Accès impossible"
        :description="error"
        class="mt-6 text-left"
      />

      <UButton
        color="neutral"
        variant="soft"
        class="mt-8"
        @click="onSignOut"
      >
        Se déconnecter
      </UButton>
    </div>
  </div>
</template>
