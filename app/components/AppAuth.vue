<script setup lang="ts">
import type { AuthSignIn } from '~/validation/auth'
import { authSignInSchema } from '~/validation/auth'
import type { FormSubmitEvent } from '@nuxt/ui'

const formState = reactive<AuthSignIn>({ email: '' })

const props = defineProps<{
  error?: string | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: AuthSignIn] }>()

const onSubmit = (event: FormSubmitEvent<AuthSignIn>) => {
  emit('submit', event.data)
}
</script>

<template>
  <UForm
    :schema="authSignInSchema"
    :state="formState"
    @submit="onSubmit"
  >
    <UAlert
      v-if="props.error"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Connexion impossible"
      :description="props.error"
      class="mb-4"
    />
    <UFormField
      label="Email"
      name="email"
      required
      class="mb-4"
    >
      <UInput
        v-model="formState.email"
        type="email"
        placeholder="email@example.com"
        size="lg"
        icon="i-lucide-mail"
      />
    </UFormField>
    <UButton
      color="primary"
      :loading="props.loading"
      type="submit"
      size="lg"
    >
      Se connecter
    </UButton>
  </UForm>
</template>
