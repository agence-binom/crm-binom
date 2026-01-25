<script setup lang="ts">
definePageMeta({ layout: false })

const user = useSupabaseUser()

watch(user, () => {
  if (user.value) {
    return navigateTo('/')
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <UIcon
        name="i-lucide-loader-2"
        class="animate-spin text-4xl mb-4"
      />
      <p class="text-gray-600">
        Vérification de votre connexion...
      </p>
    </div>
  </div>
</template>
