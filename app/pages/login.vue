<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const config = useRuntimeConfig()
const email = ref('')

const signInWithOtp = async () => {
  const redirectUrl = config.public.siteUrl
    ? `${config.public.siteUrl}/confirm`
    : `${window.location.origin}/confirm`

  const { error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: redirectUrl
    }
  })
  if (error) console.log(error)
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
          v-model:email="email"
          @sign-in-with-otp="signInWithOtp"
        />
      </UCard>
    </div>
  </div>
</template>
