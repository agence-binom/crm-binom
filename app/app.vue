<script setup>
import { fr } from '@nuxt/ui/locale'

const { public: { appEnv } } = useRuntimeConfig()
const isStaging = appEnv === 'staging'

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'fr'
  }
})

const title = 'CRM binōm'
const description = 'Gérez vos clients et contacts efficacement'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UApp
    :toaster="{ position: 'bottom-right' }"
    :locale="fr"
  >
    <div
      v-if="isStaging"
      class="flex items-center justify-center bg-orange-500 px-4 py-1.5 text-center text-sm font-medium text-white"
    >
      Environnement de STAGING — ceci n'est pas la production
    </div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
