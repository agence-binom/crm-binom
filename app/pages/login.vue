<script setup lang="ts">
definePageMeta({
  layout: false
})

const user = useSupabaseUser()

watchEffect(() => {
  if (user.value) {
    navigateTo('/')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold mb-2">
          CRM Binom
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Connectez-vous pour accéder à votre compte
        </p>
      </div>

      <UCard>
        <AppAuth />
      </UCard>
    </div>
  </div>
</template>
