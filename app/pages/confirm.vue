<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { showError } = useFeedbackToast()

watch(user, async () => {
  if (!user.value) {
    return
  }

  try {
    await $fetch('/api/auth/session')
    await navigateTo('/')
  } catch (error) {
    showError(
      'Connexion impossible',
      error,
      'Cette adresse email n’est pas autorisée à accéder à l’application.'
    )
    await supabase.auth.signOut()
    await navigateTo('/login', { replace: true })
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
