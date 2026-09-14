<script setup lang="ts">
import { getErrorMessage } from '~/lib/utils'

defineProps<{
  loading: boolean
  error: unknown
  errorTitle: string
  title?: string
  description?: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="flex flex-col gap-4 py-8">
    <div
      v-if="title"
      class="flex flex-col gap-1"
    >
      <h2 class="text-base font-semibold text-slate-900">
        {{ title }}
      </h2>
      <p
        v-if="description"
        class="text-sm text-slate-500"
      >
        {{ description }}
      </p>
    </div>

    <USkeleton
      v-if="loading"
      class="h-24"
    />
    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="errorTitle"
      :description="getErrorMessage(error, 'Merci de réessayer dans quelques instants.')"
    >
      <template #actions>
        <UButton
          color="error"
          variant="soft"
          @click="emit('retry')"
        >
          Réessayer
        </UButton>
      </template>
    </UAlert>
    <slot v-else />
  </div>
</template>
