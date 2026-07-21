<script lang="ts" setup>
const props = withDefaults(defineProps<{
  to: string
  variant?: 'primary' | 'secondary' | 'tertiary'
  ariaLabel?: string
}>(), {
  variant: 'primary'
})
</script>

<template>
  <NuxtLink
    :to="props.to"
    class="inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-neutral-100"
    :aria-label="props.ariaLabel"
  >
    <slot />
  </NuxtLink>
</template>
