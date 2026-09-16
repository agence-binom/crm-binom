<script setup lang="ts">
import { getErrorMessage } from '~/lib/utils'
import { authClient } from '~/lib/auth-client'
import logoBinom from '~/assets/images/logo-binom.svg?url'

definePageMeta({ layout: false })

const { showSuccess } = useFeedbackToast()
const loading = ref(false)
const authError = ref<string | null>(null)

const signInWithMagicLink = async ({ email }: { email: string }) => {
  const successMessage = 'Si cette adresse email est autorisée, un lien de connexion a été envoyé.'

  loading.value = true
  authError.value = null

  try {
    // Pas de pré-check d'autorisation côté client (voir server/lib/better-auth.ts,
    // sendMagicLink) : le message reste générique que l'email soit connu ou non, pour ne pas
    // exposer qui a accès à l'application (agence ou portail).
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: '/confirm' })

    if (error) {
      throw error
    }

    showSuccess('Lien envoyé', successMessage)
  } catch (error) {
    authError.value = getErrorMessage(error, 'Impossible d\'envoyer le lien de connexion.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8 flex flex-col items-center gap-8">
        <div class="w-fit rounded-lg overflow-hidden bg-default ring ring-default p-4 py-8">
          <img
            :src="logoBinom"
            alt="binōm"
            class="mx-auto h-10 w-auto dark:invert"
          >
        </div>
        <div class="space-y-2">
          <h1 class="text-3xl font-bold">
            Votre espace client
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Connectez-vous pour accéder à vos projets et documents partagés avec l'agence.
          </p>
        </div>
      </div>

      <UCard>
        <AppAuth
          :error="authError"
          :loading="loading"
          @submit="signInWithMagicLink"
        />
      </UCard>
    </div>
  </div>
</template>
