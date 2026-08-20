<script setup lang="ts">
import { formatDate } from '~/lib/utils'

defineProps<{
  icon: string
  description?: string | null
  createdAt: string | Date
}>()
</script>

<template>
  <div class="flex min-w-0 flex-1 items-start gap-3">
    <div class="rounded-lg bg-primary-50 p-2 text-primary-600">
      <UIcon
        :name="icon"
        class="text-lg"
      />
    </div>

    <div class="min-w-0 flex-1 space-y-1.5">
      <div class="flex flex-wrap items-center gap-2">
        <slot name="title" />
      </div>

      <slot name="meta" />

      <p
        v-if="description"
        class="mt-1 text-sm text-gray-500"
      >
        {{ description }}
      </p>

      <p class="mt-1 text-xs text-gray-400">
        Ajouté le {{ formatDate(createdAt) }}
      </p>
    </div>
  </div>
</template>
