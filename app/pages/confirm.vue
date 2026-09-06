<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const session = useSupabaseSession()
const { showError } = useFeedbackToast()

const getAuthCode = () => {
  const code = route.query.code
  return typeof code === 'string' && code.length > 0 ? code : null
}

const redirectToLogin = async (error?: unknown, description?: string) => {
  if (error || description) {
    showError(
      'Connexion impossible',
      error,
      description ?? 'Le lien de connexion est invalide ou a expiré.'
    )
  }

  await supabase.auth.signOut()
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

const ensureSession = async () => {
  if (session.value || user.value) {
    return session.value
  }

  const { data: sessionData } = await supabase.auth.getSession()
  if (sessionData.session) {
    return sessionData.session
  }

  const code = getAuthCode()
  if (!code) {
    return null
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    throw error
  }

  return data.session
}

onMounted(async () => {
  try {
    const resolvedSession = await ensureSession()

    if (!resolvedSession) {
      await redirectToLogin(
        null,
        'Aucune session Supabase n’a pu être créée depuis ce lien de connexion.'
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
