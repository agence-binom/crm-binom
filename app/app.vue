<script setup>
import AgencyLayout from './layouts/AgencyLayout'

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'fr'
  }
})

const title = 'CRM Binom'
const description = 'Gérez vos clients et contacts efficacement'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <AgencyLayout>
    <NuxtPage />
  </AgencyLayout>
</template>
