<script setup lang="ts">
const email = defineModel<string>('email', { required: true })

const emit = defineEmits<{
  signInWithOtp: []
}>()

const onSignInWithOtp = () => {
  emit('signInWithOtp')
}
</script>

<template>
  <div>
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
      color="primary"
      @click="onSignInWithOtp"
    >
      Se connecter
    </UButton>
  </div>
</template>
