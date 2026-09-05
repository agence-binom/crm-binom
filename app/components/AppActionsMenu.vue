<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  items: DropdownMenuItem[][]
}>()
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      size="sm"
      variant="ghost"
      color="neutral"
      icon="i-lucide-ellipsis-vertical"
      aria-label="Actions"
    />
  </UDropdownMenu>
</template>
