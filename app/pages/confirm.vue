<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

definePageMeta({ layout: false })

const { showError } = useFeedbackToast()

const redirectToLogin = async (error?: unknown, description?: string) => {
  if (error || description) {
    showError(
      'Connexion impossible',
      error,
      description ?? 'Le lien de connexion est invalide ou a expiré.'
    )
  }

  await authClient.signOut()
  await navigateTo('/login', { replace: true })
}

const validateAuthorizedSession = async () => {
  try {
    await $fetch('/api/auth/session')
    await navigateTo('/')
    return
  } catch (internalError) {
    try {
      // Les deux appels sont indépendants : touch-login ne dépend pas du résultat de session.
      // Best-effort sur touch-login : l'enregistrement de la dernière connexion ne doit pas
      // bloquer l'accès au portail si cet appel échoue pour une raison quelconque.
      await Promise.all([
        $fetch('/api/portal/session'),
        $fetch('/api/portal/touch-login', { method: 'POST' }).catch(() => {})
      ])
      await navigateTo('/espace-client')
    } catch {
      await redirectToLogin(
        internalError,
        'Cette adresse email n’est pas autorisée à accéder à l’application.'
      )
    }
  }
}

onMounted(async () => {
  try {
    // Le lien magic-link pointe vers l'endpoint de vérification de Better Auth
    // (/api/auth/magic-link/verify), qui pose déjà le cookie de session et redirige ici -
    // contrairement à Supabase, il n'y a plus d'échange de code à faire côté client.
    const { data } = await authClient.getSession()

    if (!data) {
      await redirectToLogin(
        null,
        'Aucune session n’a pu être créée depuis ce lien de connexion.'
      )
      return
    }

    await validateAuthorizedSession()
  } catch (error) {
    await redirectToLogin(
      error,
      'Le lien de connexion est invalide, expiré, ou la configuration de redirection ne correspond pas à ce domaine.'
    )
  }
})
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
