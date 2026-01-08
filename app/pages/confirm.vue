<script setup lang="ts">
definePageMeta({
  layout: false
})

const user = useSupabaseUser()
const error = ref(false)

watchEffect(() => {
  if (user.value) {
    navigateTo('/')
  }
})

setTimeout(() => {
  if (!user.value) {
    error.value = true
  }
}, 5000)
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
