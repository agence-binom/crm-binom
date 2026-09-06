<script setup lang="ts">
defineProps<{
  to: string
  label: string
}>()
</script>

<template>
  <div class="mb-4">
    <UButton
      icon="i-lucide-arrow-left"
      variant="ghost"
      color="neutral"
      size="sm"
      :to="to"
    >
      {{ label }}
    </UButton>
  </div>
</template>
