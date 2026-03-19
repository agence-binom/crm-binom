<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const config = useRuntimeConfig()
const { showError, showInfo } = useFeedbackToast()
const loading = ref(false)
const authError = ref<string | null>(null)

const signInWithOtp = async ({ email }: { email: string }) => {
  const redirectUrl = config.public.siteUrl
    ? `${config.public.siteUrl}/confirm`
    : `${window.location.origin}/confirm`

  loading.value = true
  authError.value = null

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl
    }
  })

  loading.value = false

  if (error) {
    authError.value = error.message
    showError('Connexion impossible', error, 'Impossible d\'envoyer le lien de connexion.')
    return
  }

  showInfo('Lien envoyé', 'Un lien de connexion a été envoyé à votre adresse email.')
}
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
        <AppAuth
          :error="authError"
          :loading="loading"
          @submit="signInWithOtp"
        />
      </UCard>
    </div>
  </div>
</template>
