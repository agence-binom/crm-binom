<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(false)
const email = ref('')
const sent = ref(false)

const handleLogin = async () => {
  try {
    loading.value = true
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        emailRedirectTo: `${window.location.origin}/confirm`
      }
    })
    if (error) {
      throw error
    }
    sent.value = true
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: 'Erreur',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

watchEffect(() => {
  if (user.value) {
    navigateTo('/')
  }
})
</script>

<template>
  <div v-if="!sent">
    <UForm @submit="handleLogin">
      <UFormField
        label="Email"
        name="email"
        required
        class="mb-4"
      >
        <UInput
          v-model="email"
          type="email"
          placeholder="email@example.com"
          size="lg"
        />
      </UFormField>
      <UButton
        type="submit"
        :loading="loading"
        color="primary"
      >
        Se connecter
      </UButton>
    </UForm>
  </div>
  <div
    v-else
    class="text-center py-8"
  >
    <UIcon
      name="i-lucide-mail-check"
      class="text-6xl text-green-600 mb-4"
    />
    <h3 class="text-xl font-semibold mb-2">
      Email envoyé !
    </h3>
    <p class="text-gray-600 dark:text-gray-400">
      Vérifiez votre boîte email pour le lien de connexion magique.
    </p>
    <UButton
      variant="ghost"
      class="mt-4"
      @click="sent = false"
    >
      Renvoyer un email
    </UButton>
  </div>
</template>
