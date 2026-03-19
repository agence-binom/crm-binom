<script setup lang="ts">
import { getErrorMessage } from '~/lib/utils'

definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const config = useRuntimeConfig()
const { showError, showSuccess } = useFeedbackToast()
const loading = ref(false)
const authError = ref<string | null>(null)

const signInWithOtp = async ({ email }: { email: string }) => {
  const redirectUrl = config.public.siteUrl
    ? `${config.public.siteUrl}/confirm`
    : `${window.location.origin}/confirm`
  const successMessage = 'Si cette adresse email est autorisée, un lien de connexion a été envoyé.'

  loading.value = true
  authError.value = null

  try {
    const response = await $fetch('/api/auth/authorize-email', {
      method: 'POST',
      body: { email }
    })

    if (response.authorized) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: false
        }
      })

      if (error) {
        throw error
      }
    }

    showSuccess('Lien envoyé', successMessage)
  } catch (error) {
    authError.value = getErrorMessage(error, 'Impossible d\'envoyer le lien de connexion.')
    showError('Connexion impossible', error, 'Impossible d\'envoyer le lien de connexion.')
  } finally {
    loading.value = false
  }
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
